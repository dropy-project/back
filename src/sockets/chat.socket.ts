import io, { createSocketError } from './socket';
import { AuthenticatedSocket } from '@/interfaces/auth.interface';
import { NextFunction } from 'express';
import authMiddleware from '@/middlewares/auth.middleware';
import { ChatMessage, UserConversation } from '@/interfaces/chat.interface';
import { SocketCallback } from '@/interfaces/socket.interface';
import * as chatController from '@/controllers/sockets/chat.socket.controller';
import { User } from '@prisma/client';

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
          data: await chatController.getAllMessages(conversationId),
        });
        socket.broadcast.emit('request_status');
      } catch (error) {
        callback(createSocketError(error));
      }
    });

    socket.on('leave_conversation', conversationId => {
      console.log(`[Chat socket] left conversation ${conversationId}`);
      socket.leave(`conversation-${conversationId}`);
    });

    socket.on('message_sent', async (body, callback: SocketCallback<number>) => {
      console.log(`[Chat socket] message sent`);

      const connectedUsers = await getRoomConnectedUsers(body.conversationId);

      try {
        const message = await chatController.addMessage(socket.user, connectedUsers, body);
        const chatConversation = await chatController.getConversation(socket.user, body);
        socket.broadcast.emit('message_sent', {
          status: 200,
          data: message,
        });

        const usersToEmit = await getConversationSocketUsers(chatConversation.users);

        usersToEmit.forEach((socket: AuthenticatedSocket) => {
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

  async function getConversationSocketUsers(users: User[]) {
    const sockets = await chatSocket.fetchSockets();
    return sockets.filter((socket: unknown) => users.some(user => user.id === (socket as AuthenticatedSocket).user.id));
  }
}
