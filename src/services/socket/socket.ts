import { Server } from 'socket.io';
import { NextFunction } from 'express';

import { logStartedService } from '@/utils/logs.utils';

import authMiddleware from '@/middlewares/auth.middleware';
import { AuthenticatedSocket } from '@/interfaces/auth.interface';

import * as dropySocket from './listeners/dropy.socket.listeners';
import * as chatSocket from './listeners/chat.socket.listeners';

const socketPort = 4000;

const io = new Server(socketPort, {
  maxHttpBufferSize: 1e8,
});

export const chatNamespace = io.of('/chat');
chatNamespace.use((socket, next: NextFunction) => {
  authMiddleware(socket as AuthenticatedSocket, null, next);
});

export const dropyNamespace = io.of('/dropy');
dropyNamespace.use((socket, next: NextFunction) => {
  authMiddleware(socket as AuthenticatedSocket, null, next);
});

dropySocket.startSocket();
chatSocket.startSocket();

logStartedService('Dropy Socket', socketPort);

export default io;
