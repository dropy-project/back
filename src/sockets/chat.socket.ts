import io, { createSocketError } from './socket';
import { AuthenticatedSocket } from '@/interfaces/auth.interface';
import { NextFunction } from 'express';
import authMiddleware from '@/middlewares/auth.middleware';
import { ChatMessage } from '@/interfaces/chat.interface';
import { SocketCallback } from '@/interfaces/socket.interface';
import * as chatController from '@/controllers/sockets/chat.socket.controller';

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
        callback({
          status: 200,
          data: message.id,
        });
        socket.broadcast.emit('message_sent', {
          status: 200,
          data: message,
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
  });

  async function getRoomConnectedUsers(roomId: number) {
    const sockets = await chatSocket.in(`conversation-${roomId}`).fetchSockets();
    const connectedUsers = sockets.map(socket => (socket as unknown as AuthenticatedSocket).user);
    return connectedUsers;
  }
}
