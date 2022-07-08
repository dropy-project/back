import { DropyAround } from '@/interfaces/dropy.interface';
import { AuthenticatedSocket } from '@/interfaces/auth.interface';
import { NextFunction } from 'express';

import io, { createSocketError } from './socket';

import { SocketCallback } from '@/interfaces/socket.interface';
import * as dropySocketController from '@controllers/sockets/dropy.socket.controller';
import authMiddleware from '@/middlewares/auth.middleware';

export function startSocket() {
  const dropySocket = io.of('/dropy');

  dropySocket.use((socket, next: NextFunction) => {
    authMiddleware(socket as AuthenticatedSocket, null, next);
  });

  dropySocket.on('connection', async (socket: AuthenticatedSocket) => {
    console.log(`[Dropy Socket] new connection ${socket.user.displayName} - ${socket.id}`);

    socket.on('all_dropies_around', async (callback: SocketCallback<DropyAround[]>) => {
      try {
        const dropies = await dropySocketController.findDropiesAround();
        callback({
          status: 200,
          data: dropies,
        });
      } catch (error) {
        callback(createSocketError(error));
      }
    });

    socket.on('dropy_created', async (body: unknown, callback: SocketCallback<DropyAround>) => {
      try {
        const dropy = await dropySocketController.createDropy(body, socket.user);

        callback({
          status: 200,
          data: dropy,
        });

        dropySocket.emit('dropy_created', {
          status: 200,
          data: dropy,
        });
      } catch (error) {
        callback(createSocketError(error));
      }
    });

    socket.on('dropy_retreived', async (body: any, callback: SocketCallback<null>) => {
      try {
        const dropyId = await dropySocketController.retrieveDropy(body, socket.user);

        callback({ status: 200 });

        dropySocket.emit('dropy_retreived', {
          status: 200,
          data: dropyId,
        });
      } catch (error) {
        callback(createSocketError(error));
      }
    });
  });
}
