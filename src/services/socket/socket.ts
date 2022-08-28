import { Server } from 'socket.io';
import { NextFunction } from 'express';

import { logStartedService } from '@/utils/logs.utils';

import authMiddleware from '@/middlewares/auth.middleware';
import { AuthenticatedSocket } from '@/interfaces/auth.interface';

const socketPort = 4000;

const io = new Server(socketPort);

export const chatNamespace = io.of('/chat');
chatNamespace.use((socket, next: NextFunction) => {
  authMiddleware(socket as AuthenticatedSocket, null, next);
});

export const dropyNamespace = io.of('/dropy');
dropyNamespace.use((socket, next: NextFunction) => {
  authMiddleware(socket as AuthenticatedSocket, null, next);
});

logStartedService('Dropy Socket', socketPort);

export default io;
