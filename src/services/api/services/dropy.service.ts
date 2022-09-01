import client from '@/client';
import { HttpException } from '@exceptions/HttpException';
import { Dropy, MediaType, User } from '@prisma/client';
import { deleteContent } from '@/utils/content.utils';
import { DropyWithUsers, SimplifiedDropy } from '@/interfaces/dropy.interface';

export async function createDropy(user: User, latitude, longitude): Promise<Dropy> {
  const dropy = client.dropy.create({ data: { emitterId: user.id, latitude, longitude } });
  return dropy;
}

export async function getDropyById(dropyId: number): Promise<Dropy> {
  const dropy = await client.dropy.findUnique({ where: { id: dropyId } });

  if (dropy == undefined) {
    throw new HttpException(404, `Dropy with id ${dropyId} not found`);
  }

  return dropy;
}

export async function getDropy(dropyId: number): Promise<DropyWithUsers> {
  const dropy = await client.dropy.findUnique({
    where: { id: dropyId },
    include: { emitter: true, retriever: true },
  });

  if (dropy == undefined) {
    throw new HttpException(404, `Dropy with id ${dropyId} not found`);
  }

  return {
    id: dropy.id,
    latitude: dropy.latitude,
    longitude: dropy.longitude,
    mediaUrl: dropy.mediaUrl,
    retrieveDate: dropy.retrieveDate,
    mediaType: dropy.mediaType,
    creationDate: dropy.creationDate,
    emitterId: dropy.emitterId,
    emitterDisplayName: dropy.emitter.displayName,
    retrieverId: dropy.retrieverId,
    retrieverDisplayName: dropy.retriever.displayName,
    conversationId: dropy.chatConversationId,
  };
}

export async function userEmittedDropies(user: User): Promise<SimplifiedDropy[]> {
  const userDropies = await client.dropy.findMany({
    where: { emitterId: user.id },
    orderBy: { creationDate: 'desc' },
  });

  const simplifiedDropies = userDropies.map(dropy => {
    return {
      id: dropy.id,
      mediaType: dropy.mediaType,
      mediaUrl: dropy.mediaUrl,
      creationDate: dropy.creationDate,
      retrieveDate: dropy.retrieveDate,
      latitude: dropy.latitude,
      longitude: dropy.longitude,
    };
  });

  return simplifiedDropies;
}

export async function deleteDropy(dropyId: number, user: User, Authorization: string): Promise<void> {
  const dropy = await client.dropy.findUnique({ where: { id: dropyId } });

  if (dropy == undefined) {
    throw new HttpException(404, `Dropy with id ${dropyId} not found`);
  }

  if (user.id != dropy.emitterId) {
    throw new HttpException(403, `You can't delete this dropy`);
  }

  if (dropy.mediaType === MediaType.PICTURE || dropy.mediaType === MediaType.VIDEO) {
    deleteContent(dropy.mediaUrl, Authorization);
  }

  await client.dropy.delete({ where: { id: dropyId } });
}
