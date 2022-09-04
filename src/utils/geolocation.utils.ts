import { User } from '@prisma/client';
import client from '@/client';
import { DropyAround } from '@/interfaces/dropy.interface';

export const GEOHASH_SIZE = 32;

export async function findDropiesByGeohash(user: User, zones: string[]): Promise<DropyAround[]> {
  const dropiesByGeohash = await client.dropy.findMany({
    where: {
      geohash: { in: zones },
      retrieverId: null,
    },
    include: { emitter: true },
  });

  const userWithBlockedUsers = await client.user.findUnique({
    where: { id: user.id },
    include: { blockedUsers: true },
  });

  const blockedUsersId = userWithBlockedUsers.blockedUsers.map(users => users.id);

  const cleanedDropies = dropiesByGeohash
    .filter(dropy => dropy.emitter.isBanned == false || dropy.emitterId === user.id)
    .filter(dropy => !blockedUsersId.includes(dropy.emitterId));

  return cleanedDropies.map(dropy => {
    return {
      id: dropy.id,
      creationDate: dropy.creationDate,
      latitude: dropy.latitude,
      longitude: dropy.longitude,
      emitterId: dropy.emitterId,
    };
  });
}
