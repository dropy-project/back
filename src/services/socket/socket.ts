import { Server } from 'socket.io';
import express, { NextFunction } from 'express';
import { addMetricsRoute } from './metrics/metrics.socket';

import { logStartedService } from '@/utils/logs.utils';

import authMiddleware from '@/middlewares/auth.middleware';
import doubleSocketMiddleware from '@/middlewares/doublesocket.middleware';
import { AuthenticatedSocket } from '@/interfaces/auth.interface';

import * as dropySocket from './listeners/dropy.socket.listeners';
import * as chatSocket from './listeners/chat.socket.listeners';

const socketPort = 4000;
const metricsPort = 4001;

const io = new Server(socketPort, {
  maxHttpBufferSize: 1e8,
});

export const chatNamespace = io.of('/chat');
chatNamespace.use((socket, next: NextFunction) => {
  authMiddleware(socket as AuthenticatedSocket, null, next);
});

chatNamespace.use((socket, next: NextFunction) => {
  doubleSocketMiddleware(socket as AuthenticatedSocket, chatNamespace, next);
});

export const dropyNamespace = io.of('/dropy');
dropyNamespace.use((socket, next: NextFunction) => {
  authMiddleware(socket as AuthenticatedSocket, null, next);
});
dropyNamespace.use((socket, next: NextFunction) => {
  doubleSocketMiddleware(socket as AuthenticatedSocket, chatNamespace, next);
});

dropySocket.startSocket();
chatSocket.startSocket();

logStartedService('Dropy Socket', socketPort);

const metrics_server = express();
addMetricsRoute(metrics_server);

metrics_server.listen(metricsPort, () => {
  logStartedService('Socket Metrics', metricsPort);
});

export default io;
