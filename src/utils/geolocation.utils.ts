import { Dropy, MediaType, User } from '@prisma/client';
import client from '@/client';

const DISTANCE_FILTER_RADIUS = 0.003; // Environ 300m

export function getDistanceFromLatLonInMeters(lat1, lon1, lat2, lon2) {
  const deg2rad = deg => deg * (Math.PI / 180);
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1); // deg2rad below
  const dLon = deg2rad(lon2 - lon1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d * 1000; // Distance in meters
}

export async function getAvailableDropiesAroundLocation(
  latitude: number,
  longitude: number,
  user: User = undefined,
): Promise<(Dropy & { emitter: User })[]> {
  const andQuery: Object[] = [
    {
      latitude: {
        gt: latitude - DISTANCE_FILTER_RADIUS,
        lt: latitude + DISTANCE_FILTER_RADIUS,
      },
    },
    {
      longitude: {
        gt: longitude - DISTANCE_FILTER_RADIUS,
        lt: longitude + DISTANCE_FILTER_RADIUS,
      },
    },
    {
      mediaType: {
        not: MediaType.NONE,
      },
    },
    {
      retrieverId: {
        equals: null,
      },
    },
  ];

  if (user != undefined) {
    andQuery.push({
      emitterId: {
        not: user.id,
      },
    });
  }

  return await client.dropy.findMany({
    where: { AND: andQuery },
    include: { emitter: true },
  });
}
