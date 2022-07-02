import { Server } from 'socket.io';
import { DropyAround } from '@/interfaces/dropy.interface';
import { AuthenticatedSocket } from '@/interfaces/auth.interface';
import { NextFunction } from 'express';
import { HttpException } from '@/exceptions/HttpException';
import { logStartedService } from '@/utils/logs.utils';

import authMiddleware from '@/middlewares/auth.middleware';
import * as dropySocketController from '@controllers/sockets/dropy.socket.controller';

export function startSocket(port: number) {
  const io = new Server(port);

  io.use((socket, next: NextFunction) => authMiddleware(socket as AuthenticatedSocket, null, next));

  logStartedService('Dropy Socket', port);

  const findDropiesAround = async (): Promise<DropyAround[]> => {
    try {
      const dropies = await dropySocketController.findDropiesAround();
      return dropies;
    } catch (error) {
      return [];
    }
  };

  io.on('connection', async (socket: AuthenticatedSocket) => {
    console.log(`New connection ${socket.user.displayName} - ${socket.id}`);

    socket.emit('all_dropies_around', await findDropiesAround());

    socket.on('dropy_created', async (body, createdCb) => {
      try {
        const dropyId = await dropySocketController.createDropy(body, socket.user);
        createdCb({
          status: 200,
          data: dropyId,
        });
        io.emit('all_dropies_around', await findDropiesAround());
      } catch (error) {
        handleError(error, createdCb);
      }
    });

    socket.on('dropy_retreived', async (dropyId, retreivedCb) => {
      try {
        await dropySocketController.retrieveDropy(dropyId, socket.user);
        retreivedCb({ status: 200 });
        io.emit('all_dropies_around', await findDropiesAround());
      } catch (error) {
        handleError(error, retreivedCb);
      }
    });
  });
}

function handleError(error, callback) {
  if (error instanceof HttpException) {
    callback({ status: error.status, error: error });
  } else {
    callback({ status: 500, error: 'Internal server error' });
  }
}
