import { Server } from 'socket.io';
import { NextFunction } from 'express';

import { logStartedService } from '@/utils/logs.utils';
import { AuthenticatedSocket } from '@/interfaces/auth.interface';

import authMiddleware from '@/middlewares/auth.middleware';
import { HttpException } from '@/exceptions/HttpException';
import { SocketResponse } from '@/interfaces/socket.interface';

const socketPort = Number(process.env.SOCKET_PORT) || 4000;

console.log(`Starting socket server on port ${socketPort}`);
const io = new Server(socketPort);
io.use((socket, next: NextFunction) => authMiddleware(socket as AuthenticatedSocket, null, next));

logStartedService('Dropy Socket', socketPort);

export default io;

export function handleError(error, callback: (error: SocketResponse) => void | null) {
  if (error instanceof HttpException) {
    callback && callback({ status: error.status, error: error.message });
  } else {
    console.error(`[Socket error] >> SERVER SIDE ERROR`, error);
    callback && callback({ status: 500, error: 'Internal server error' });
  }
}
