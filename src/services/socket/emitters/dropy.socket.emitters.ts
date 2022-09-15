import { DropyAround, DropyWithUsers } from '@/interfaces/dropy.interface';
import { AuthenticatedSocket } from '@/interfaces/auth.interface';
import { SocketCallback } from '@/interfaces/socket.interface';
import { modifyEnergyLevelOfAnUser } from '@/services/api/services/users.service';
import * as dropyService from '@services/socket/services/dropy.socket.service';
import { dropyNamespace } from '../socket';
import { findDropiesByGeohash } from '@/utils/geolocation.utils';

const ENERGY_MODIFICATION = 30;

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
  modifyEnergyLevelOfAnUser(clientSocket.user, ENERGY_MODIFICATION);

  callback({
    status: 200,
    energy: clientSocket.user.energy,
  });
}

export async function retrieveDropy(socket: AuthenticatedSocket, dropyId: number, callback: SocketCallback<DropyWithUsers>) {
  const [dropyWithUsers, geohash] = await dropyService.retrieveDropy(socket.user, dropyId);
  modifyEnergyLevelOfAnUser(socket.user, -ENERGY_MODIFICATION);
  dropyNamespace.to(`zone-${geohash}`).emit('dropy_retrieved', {
    status: 200,
    data: dropyId,
  });

  callback({
    status: 200,
    data: dropyWithUsers,
    energy: socket.user.energy,
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
