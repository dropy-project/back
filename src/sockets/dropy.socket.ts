import { DropyAround } from '@/interfaces/dropy.interface';
import { AuthenticatedSocket } from '@/interfaces/auth.interface';

import io, { handleError } from './socket';

import * as dropySocketController from '@controllers/sockets/dropy.socket.controller';

export function startSocket() {
  io.of('/dropy').on('connection', async (socket: AuthenticatedSocket) => {
    console.log(`New socket connection ${socket.user.displayName} - ${socket.id}`);

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

const findDropiesAround = async (): Promise<DropyAround[]> => {
  try {
    const dropies = await dropySocketController.findDropiesAround();
    return dropies;
  } catch (error) {
    handleError(error, null);
  }
};
