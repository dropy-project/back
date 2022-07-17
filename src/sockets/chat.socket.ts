import io, { createSocketError } from './socket';
import { AuthenticatedSocket } from '@/interfaces/auth.interface';
import { NextFunction } from 'express';
import authMiddleware from '@/middlewares/auth.middleware';
import { UserMessage, UserConversation } from '@/interfaces/chat.interface';
import { SocketCallback } from '@/interfaces/socket.interface';
import * as chatController from '@/controllers/sockets/chat.socket.controller';
import { ChatConversation, User } from '@prisma/client';
import * as userController from '@controllers/users.controller';
import { throwIfNotNumber } from '@/utils/controller.utils';

export function startSocket() {
  const chatSocket = io.of('/chat');

  chatSocket.use((socket, next: NextFunction) => {
    authMiddleware(socket as AuthenticatedSocket, null, next);
  });

  chatSocket.on('connection', async (socket: AuthenticatedSocket) => {
    console.log(`[Chat socket] new connection ${socket.user.displayName} - ${socket.id}`);

    sendConnectionStatus(socket, true);

    socket.on('join_conversation', async (conversationId: number, callback: SocketCallback<UserMessage[]>) => {
      console.log(`[Chat socket] join conversation ${conversationId}`);

      try {
        await socket.join(`conversation-${conversationId}`);
        callback({
          status: 200,
        });
        const conversation = await chatController.getConversationByIdWithUsers(conversationId);
        const otherUser = conversation.users.find((u: User) => u.id !== socket.user.id);

        socket.emit('user_status', {
          status: 200,
          data: otherUser.isOnline,
        });
      } catch (error) {
        callback(createSocketError(error));
      }
    });

    socket.on('list_messages', async (body, callback: SocketCallback<UserMessage[]>) => {
      console.log(`[Chat socket] list messages`);
      try {
        const messages = await chatController.getMessages(body);
        callback({
          status: 200,
          data: messages,
        });
      } catch (error) {
        callback(createSocketError(error));
      }
    });

    socket.on('leave_conversation', conversationId => {
      console.log(`[Chat socket] left conversation ${conversationId}`);
      socket.leave(`conversation-${conversationId}`);
    });

    socket.on('close_conversation', async (conversationId, callback: SocketCallback<null>) => {
      console.log(`[Chat socket] close conversation : ${conversationId}`);
      try {
        await chatController.closeConversation(conversationId);

        const chatConversation = await chatController.getConversationByIdWithUsers(conversationId);
        const usersToEmit = await getUsersSockets(chatConversation.users);

        usersToEmit.forEach(socket => {
          chatSocket.to(socket.id).emit('close_conversation', {
            status: 200,
            data: { id: chatConversation.id },
          });
        });

        callback({
          status: 200,
          data: null,
        });
      } catch (error) {
        callback(createSocketError(error));
      }
    });

    socket.on('message_sent', async (body, callback: SocketCallback<number>) => {
      console.log(`[Chat socket] message sent`);

      const { conversationId } = body;
      try {
        throwIfNotNumber(conversationId);

        const connectedUsers = await getRoomConnectedUsers(conversationId);
        const message = await chatController.addMessage(socket.user, connectedUsers, body);
        const chatConversation = await chatController.getConversationByIdWithUsers(conversationId);

        socket.broadcast.to(`conversation-${conversationId}`).emit('message_sent', {
          status: 200,
          data: message,
        });

        const usersToEmit = await getUsersSockets(chatConversation.users);

        usersToEmit.forEach(socket => {
          const otherUser = chatConversation.users.find((u: User) => u.id !== socket.user.id);

          chatSocket.to(socket.id).emit('conversation_updated', {
            status: 200,
            data: {
              id: chatConversation.id,
              isOnline: socket.user.isOnline,
              isRead: false,
              lastMessagePreview: message?.content ?? null,
              lastMessageDate: message?.date ?? null,
              user: {
                userId: otherUser.id,
                displayName: otherUser.displayName,
              },
            },
          });
        });

        callback({
          status: 200,
          data: message.id,
        });
      } catch (error) {
        callback(createSocketError(error));
      }
    });

    socket.on('list_conversations', async (callback: SocketCallback<UserConversation[]>) => {
      const userConversations = await chatController.getAllUserConversations(socket.user);
      callback({
        status: 200,
        data: userConversations,
      });
    });

    socket.on('disconnecting', async () => {
      console.log(`User disconnected ${socket.user.displayName}`);
      sendConnectionStatus(socket, false);
    });
  });

  async function sendConnectionStatus(socket: AuthenticatedSocket, connected: boolean) {
    await userController.changeOnlineStatus(socket.user, connected);
    const userConversations = await chatController.getAllChatConversations(socket.user);

    userConversations.forEach(async (conversation: ChatConversation & { users: User[] }) => {
      const message = await chatController.getLastMessage(conversation.id);
      const usersToEmit = await getUsersSockets(conversation.users);

      chatSocket.to(`conversation-${conversation.id}`).emit('user_status', {
        status: 200,
        data: connected,
      });

      usersToEmit.forEach(socket => {
        const otherUser = conversation.users.find((u: User) => u.id !== socket.user.id);

        chatSocket.to(socket.id).emit('conversation_updated', {
          status: 200,
          data: {
            id: conversation.id,
            isOnline: connected,
            isRead: false,
            lastMessagePreview: message?.content ?? null,
            lastMessageDate: message?.date ?? null,
            user: {
              userId: otherUser.id,
              displayName: otherUser.displayName,
            },
          },
        });
      });
    });
  }

  async function getRoomConnectedUsers(conversationId: number): Promise<User[]> {
    const sockets = await chatSocket.in(`conversation-${conversationId}`).fetchSockets();
    const connectedUsers = sockets.map(socket => (socket as unknown as AuthenticatedSocket).user);
    return connectedUsers;
  }

  async function getUsersSockets(users: User[]): Promise<AuthenticatedSocket[]> {
    const sockets = await chatSocket.fetchSockets();

    const remoteSockets = sockets.filter((socket: unknown) => {
      return users.some(user => user.id === (socket as AuthenticatedSocket).user.id);
    });

    return remoteSockets.map(socket => {
      return socket as unknown as AuthenticatedSocket;
    });
  }
}
