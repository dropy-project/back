import { dropyNamespace } from './socket';

import { DropyAround } from '@/interfaces/dropy.interface';
import { AuthenticatedSocket } from '@/interfaces/auth.interface';
import { SocketCallback } from '@/interfaces/socket.interface';

import * as dropyService from '@services/dropy.service';

export async function emitAllDropiesAround(callback: SocketCallback<DropyAround[]>) {
  const dropies = await dropyService.findDropiesAround();
  callback({
    status: 200,
    data: dropies,
  });
}

export async function createDropy(clientSocket: AuthenticatedSocket, latitude: number, longitude: number, callback: SocketCallback<DropyAround>) {
  const dropy = await dropyService.createDropy(clientSocket.user, latitude, longitude);

  dropyNamespace.emit('dropy_created', {
    status: 200,
    data: dropy,
  });

  callback({
    status: 200,
    data: dropy,
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
