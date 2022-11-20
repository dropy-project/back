import { dropyNamespace } from '../socket';

import { AuthenticatedSocket } from '@interfaces/auth.interface';

import { throwIfNotFunction, throwIfNotNumber, throwIfNotString, throwIfNull } from '@utils/controller.utils';
import { Logger } from '@utils/logs.utils';
import { handleSocketRawError } from '@utils/socket.utils';

import * as dropySocket from '@services/socket/emitters/dropy.socket.emitters';
import { HttpException } from '@/exceptions/HttpException';
import { resetUserBadgeNotification } from '../services/user.socket.service';

export function startSocket() {
  dropyNamespace.on('connection', async (socket: AuthenticatedSocket) => {
    const logger = new Logger('Dropy Socket', socket.user);
    socket.user = await resetUserBadgeNotification(socket.user);

    logger.log('Connected');

    socket.on('zones_update', async (data: any, callback) => {
      try {
        const { zones } = data;
        throwIfNull(zones);

        if (zones.length === undefined) {
          throw new HttpException(400, 'Zones must be an array');
        }

        if (zones.length !== 9) {
          throw new HttpException(400, '9 Zones must be provided');
        }

        zones.forEach(zone => {
          throwIfNotNumber(zone);
        });

        await dropySocket.updateZones(socket, zones, callback);
        logger.log(`${socket.user.username}'s zones updated around ${zones[0]}`);
      } catch (error) {
        handleSocketRawError(callback, error);
      }
    });

    socket.on('dropy_created', async (data: any, callback) => {
      try {
        const { latitude, longitude, mediaType, content } = data;
        throwIfNull(content);
        throwIfNotString(mediaType);
        throwIfNotNumber(latitude, longitude);
        throwIfNotFunction(callback);

        await dropySocket.createDropy(socket, latitude, longitude, mediaType, content, callback);
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
