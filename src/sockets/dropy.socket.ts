import { DropyAround } from '@/interfaces/dropy.interface';
import { AuthenticatedSocket } from '@/interfaces/auth.interface';
import { NextFunction } from 'express';

import io, { createSocketError } from './socket';

import { SocketCallback, SocketResponse } from '@/interfaces/socket.interface';
import * as dropySocketController from '@controllers/sockets/dropy.socket.controller';
import authMiddleware from '@/middlewares/auth.middleware';

export function startSocket() {
  const dropySocket = io.of('/dropy');

  dropySocket.use((socket, next: NextFunction) => {
    authMiddleware(socket as AuthenticatedSocket, null, next);
  });

  dropySocket.on('connection', async (socket: AuthenticatedSocket) => {
    console.log(`[Dropy Socket] new connection ${socket.user.displayName} - ${socket.id}`);

    socket.emit('all_dropies_around', await findDropiesAround());

    socket.on('dropy_created', async (body: unknown, callback: SocketCallback<Number>) => {
      try {
        const dropyId = await dropySocketController.createDropy(body, socket.user);

        callback({
          status: 200,
          data: dropyId,
        });

        dropySocket.emit('all_dropies_around', await findDropiesAround());
      } catch (error) {
        callback(createSocketError(error));
      }
    });

    socket.on('dropy_retreived', async (dropyId: Number, callback: SocketCallback<null>) => {
      try {
        await dropySocketController.retrieveDropy(dropyId, socket.user);

        callback({ status: 200 });

        dropySocket.emit('all_dropies_around', await findDropiesAround());
      } catch (error) {
        callback(createSocketError(error));
      }
    });
  });
}

const findDropiesAround = async (): Promise<SocketResponse<DropyAround[]>> => {
  try {
    const dropies = await dropySocketController.findDropiesAround();
    return {
      status: 200,
      data: dropies,
    };
  } catch (error) {
    return createSocketError(error);
  }
};
