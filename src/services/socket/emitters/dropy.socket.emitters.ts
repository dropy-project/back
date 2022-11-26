import { DropyAround, DropyWithUsers } from '@/interfaces/dropy.interface';
import { AuthenticatedSocket } from '@/interfaces/auth.interface';
import { SocketCallback } from '@/interfaces/socket.interface';
import { incrementUserEnergy } from '@services/socket/services/user.socket.service';
import * as dropyService from '@services/socket/services/dropy.socket.service';
import { dropyNamespace } from '../socket';
import { findDropiesByGeohash } from '@/utils/geolocation.utils';

const RETRIEVE_ENERGY_COST = -30;
const EMIT_ENERGY_GAIN = 30;

export async function createDropy(
  clientSocket: AuthenticatedSocket,
  latitude: number,
  longitude: number,
  mediaType: string,
  content: string | Buffer,
  callback: SocketCallback<{ newEnergy: number; oldEnergy: number }>,
) {
  const dropy = await dropyService.createDropy(
    clientSocket.user,
    latitude,
    longitude,
    mediaType,
    content,
    clientSocket.handshake.headers['authorization'] as string,
  );

  dropyNamespace.to(`zone-${dropy.geohash}`).emit('dropy_created', {
    status: 200,
    data: {
      id: dropy.id,
      latitude: dropy.latitude,
      longitude: dropy.longitude,
      creationDate: dropy.creationDate,
      emitterId: dropy.emitterId,
      ambassador: clientSocket.user.isAmbassador,
      premium: clientSocket.user.isPremium,
    } as DropyAround,
  });
  const incrementResult = await incrementUserEnergy(clientSocket, EMIT_ENERGY_GAIN);

  callback({
    status: 200,
    data: incrementResult,
  });
}

export async function retrieveDropy(
  socket: AuthenticatedSocket,
  dropyId: number,
  callback: SocketCallback<{ dropy: DropyWithUsers; newEnergy: number; oldEnergy: number }>,
) {
  const [dropyWithUsers, geohash] = await dropyService.retrieveDropy(socket.user, dropyId);
  const energy = await incrementUserEnergy(socket, RETRIEVE_ENERGY_COST);

  dropyNamespace.to(`zone-${geohash}`).emit('dropy_retrieved', {
    status: 200,
    data: dropyId,
  });

  callback({
    status: 200,
    data: { dropy: dropyWithUsers, newEnergy: energy.newEnergy, oldEnergy: energy.oldEnergy },
  });
}

export async function updateZones(socket: AuthenticatedSocket, zones: number[], callback: SocketCallback<DropyAround[]>) {
  socket.rooms.forEach(room => {
    if (room.includes('zone')) {
      socket.leave(room);
    }
  });

  for (const zone of zones) {
    await socket.join(`zone-${zone}`);
  }

  const dropiesInGeohash = await findDropiesByGeohash(
    socket.user,
    zones.map(z => z.toString()),
  );

  callback({
    status: 200,
    data: dropiesInGeohash,
  });
}
