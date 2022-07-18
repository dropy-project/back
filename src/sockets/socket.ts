import { Server } from 'socket.io';

import { logStartedService } from '@/utils/logs.utils';

import { HttpException } from '@/exceptions/HttpException';
import { SocketResponse } from '@/interfaces/socket.interface';
import authMiddleware from '@/middlewares/auth.middleware';
import { AuthenticatedSocket } from '@/interfaces/auth.interface';
import { NextFunction } from 'express';

const socketPort = 4000;

const io = new Server(socketPort);

export const chatNamespace = io.of('/chat');
chatNamespace.use((socket, next: NextFunction) => {
  authMiddleware(socket as AuthenticatedSocket, null, next);
});

export const conversationsNamespace = io.of('/conversations');
conversationsNamespace.use((socket, next: NextFunction) => {
  authMiddleware(socket as AuthenticatedSocket, null, next);
});

logStartedService('Dropy Socket', socketPort);

export default io;

export function createSocketError(error): SocketResponse<null> {
  if (error instanceof HttpException) {
    return { status: error.status, error: error.message };
  } else {
    console.error(`[Socket error] >> SERVER SIDE ERROR`, error);
    return { status: 500, error: 'Internal server error' };
  }
}
