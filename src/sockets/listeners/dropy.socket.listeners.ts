import { dropyNamespace } from '../socket';

import { DropyAround } from '@/interfaces/dropy.interface';
import { AuthenticatedSocket } from '@/interfaces/auth.interface';
import { SocketCallback } from '@/interfaces/socket.interface';

import { throwIfNotNumber } from '@/utils/controller.utils';
import { Logger } from '@/utils/logs.utils';
import { createSocketError } from '@/utils/socket.utils';

import * as dropySocket from '../dropy.socket';

export function startSocket() {
  dropyNamespace.on('connection', async (socket: AuthenticatedSocket) => {
    const logger = new Logger('Chat Socket', socket.user);

    logger.log('Connected');

    socket.on('all_dropies_around', async (cb: SocketCallback<DropyAround[]>) => {
      try {
        await dropySocket.emitAllDropiesAround(cb);
        logger.log('All dropies around');
      } catch (error) {
        cb(createSocketError(error));
      }
    });

    socket.on('dropy_created', async (data: any, cb) => {
      try {
        const { latitude, longitude } = data;
        throwIfNotNumber(latitude);
        throwIfNotNumber(longitude);

        await dropySocket.createDropy(socket, latitude, longitude, cb);
        logger.log('Dropy created');
      } catch (error) {
        cb(createSocketError(error));
      }
    });

    socket.on('dropy_retrieved', async (data: any, callback: SocketCallback<null>) => {
      try {
        const { dropyId } = data;
        throwIfNotNumber(dropyId);

        dropySocket.retrieveDropy(socket, dropyId, callback);
        logger.log('Dropy retrieved');
      } catch (error) {
        callback(createSocketError(error));
      }
    });
  });
}
