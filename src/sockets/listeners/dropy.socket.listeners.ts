import { dropyNamespace } from '../socket';

import { AuthenticatedSocket } from '@/interfaces/auth.interface';

import { throwIfNotFunction, throwIfNotNumber } from '@/utils/controller.utils';
import { Logger } from '@/utils/logs.utils';
import { handleSocketRawError } from '@/utils/socket.utils';

import * as dropySocket from '../dropy.socket';

export function startSocket() {
  dropyNamespace.on('connection', async (socket: AuthenticatedSocket) => {
    const logger = new Logger('Dropy Socket', socket.user);

    logger.log('Connected');

    socket.on('all_dropies_around', async callback => {
      try {
        throwIfNotFunction(callback);

        await dropySocket.emitAllDropiesAround(callback);
        logger.log('All dropies around');
      } catch (error) {
        handleSocketRawError(callback, error);
      }
    });

    socket.on('dropy_created', async (data: any, callback) => {
      try {
        const { latitude, longitude } = data;
        throwIfNotNumber(latitude, longitude);
        throwIfNotFunction(callback);

        await dropySocket.createDropy(socket, latitude, longitude, callback);
        logger.log('Dropy created');
      } catch (error) {
        handleSocketRawError(callback, error);
      }
    });

    socket.on('dropy_retrieved', async (data: any, callback) => {
      try {
        const { dropyId } = data;
        throwIfNotNumber(dropyId);
        throwIfNotFunction(callback);

        await dropySocket.retrieveDropy(socket, dropyId, callback);
        logger.log('Dropy retrieved');
      } catch (error) {
        handleSocketRawError(callback, error);
      }
    });
  });
}
