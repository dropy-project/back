import io, { createSocketError } from './socket';
import { AuthenticatedSocket } from '@/interfaces/auth.interface';
import { NextFunction } from 'express';
import authMiddleware from '@/middlewares/auth.middleware';
import { ChatMessage, UserConversation } from '@/interfaces/chat.interface';
import { SocketCallback } from '@/interfaces/socket.interface';
import * as chatController from '@/controllers/sockets/chat.socket.controller';
import { User } from '@prisma/client';
import { throwIfNotNumber } from '@/utils/controller.utils';

export function startSocket() {
  const chatSocket = io.of('/chat');

  chatSocket.use((socket, next: NextFunction) => {
    authMiddleware(socket as AuthenticatedSocket, null, next);
  });

  chatSocket.on('connection', async (socket: AuthenticatedSocket) => {
    console.log(`[Chat socket] new connection ${socket.user.displayName} - ${socket.id}`);

    socket.on('join_conversation', async (conversationId: number, callback: SocketCallback<ChatMessage[]>) => {
      console.log(`[Chat socket] join conversation ${conversationId}`);

      try {
        socket.join(`conversation-${conversationId}`);
        callback({
          status: 200,
        });
        socket.broadcast.emit('request_status');
      } catch (error) {
        callback(createSocketError(error));
      }
    });

    socket.on('list_messages', async (body, callback: SocketCallback<ChatMessage[]>) => {
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
              isOnline: true,
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

    socket.on('user_status', async (userStatus: boolean) => {
      socket.broadcast.emit('user_status', {
        status: 200,
        data: userStatus,
      });
    });

    socket.on('list_conversations', async (callback: SocketCallback<UserConversation[]>) => {
      const userConversations = await chatController.getAllUserConversations(socket.user);
      callback({
        status: 200,
        data: userConversations,
      });
    });
  });

  async function getRoomConnectedUsers(roomId: number) {
    const sockets = await chatSocket.in(`conversation-${roomId}`).fetchSockets();
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
