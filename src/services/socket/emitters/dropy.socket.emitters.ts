import { DropyAround } from '@/interfaces/dropy.interface';
import { AuthenticatedSocket } from '@/interfaces/auth.interface';
import { SocketCallback } from '@/interfaces/socket.interface';

import * as dropyService from '@services/socket/services/dropy.socket.service';
import { dropyNamespace } from '../socket';

export async function emitAllDropiesAround(
  clientSocket: AuthenticatedSocket,
  latitude: number,
  longitude: number,
  callback: SocketCallback<DropyAround[]>,
) {
  const dropies = await dropyService.findDropiesAround(clientSocket.user, latitude, longitude);
  callback({
    status: 200,
    data: dropies,
  });
}

export async function createDropy(
  clientSocket: AuthenticatedSocket,
  latitude: number,
  longitude: number,
  mediaType: string,
  content: string | Buffer,
  callback: SocketCallback<DropyAround>,
) {
  const dropy = await dropyService.createDropy(
    clientSocket.user,
    latitude,
    longitude,
    mediaType,
    content,
    clientSocket.handshake.headers['authorization'] as string,
  );

  dropyNamespace.emit('dropy_created', {
    status: 200,
    data: dropy,
  });

  callback({
    status: 200,
  });
}

export async function retrieveDropy(socket: AuthenticatedSocket, dropyId: number, callback: SocketCallback<null>) {
  await dropyService.retrieveDropy(socket.user, dropyId);

  dropyNamespace.emit('dropy_retrieved', {
    status: 200,
    data: dropyId,
  });

  callback({
    status: 200,
  });
}
