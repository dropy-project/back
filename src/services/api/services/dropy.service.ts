import client from '@/client';
import { HttpException } from '@exceptions/HttpException';
import { MediaType, User } from '@prisma/client';
import { deleteContent } from '@/utils/content.utils';
import { DropyAround, DropyWithUsers } from '@/interfaces/dropy.interface';
import { SimplifiedUser } from '@/interfaces/user.interface';

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
    conversationId: dropy.chatConversationId,
    emitter: {
      id: dropy.emitter.id,
      username: dropy.emitter.username,
      avatarUrl: dropy.emitter.avatarUrl,
      displayName: dropy.emitter.displayName,
    },
    retriever: {
      id: dropy.retriever.id,
      username: dropy.retriever.username,
      avatarUrl: dropy.retriever.avatarUrl,
      displayName: dropy.retriever.displayName,
    },
  };
}

export async function userEmittedDropies(user: User): Promise<DropyWithUsers[]> {
  const userDropies = await client.dropy.findMany({
    where: { emitterId: user.id },
    orderBy: { creationDate: 'desc' },
    include: { emitter: true, retriever: true },
  });

  return userDropies.map(dropy => {
    return {
      id: dropy.id,
      mediaType: dropy.mediaType,
      mediaUrl: dropy.mediaUrl,
      creationDate: dropy.creationDate,
      retrieveDate: dropy.retrieveDate,
      latitude: dropy.latitude,
      longitude: dropy.longitude,
      conversationId: dropy.chatConversationId,
      emitter: {
        id: user.id,
        username: user.username,
        avatarUrl: user.avatarUrl,
        displayName: user.displayName,
      },
      retriever:
        dropy.retrieverId != null
          ? {
              id: dropy.retrieverId,
              username: dropy.retriever.username,
              avatarUrl: dropy.retriever.avatarUrl,
              displayName: dropy.retriever.displayName,
            }
          : null,
    };
  });
}

export async function userRetrievedDropies(user: User): Promise<DropyWithUsers[]> {
  const userDropies = await client.dropy.findMany({
    where: { retrieverId: user.id },
    orderBy: { creationDate: 'desc' },
    include: { emitter: true, retriever: true },
  });

  return userDropies.map(dropy => {
    return {
      id: dropy.id,
      mediaType: dropy.mediaType,
      mediaUrl: dropy.mediaUrl,
      creationDate: dropy.creationDate,
      retrieveDate: dropy.retrieveDate,
      latitude: dropy.latitude,
      longitude: dropy.longitude,
      conversationId: dropy.chatConversationId,
      emitter: {
        id: dropy.emitter.id,
        username: dropy.emitter.username,
        avatarUrl: dropy.emitter.avatarUrl,
        displayName: dropy.emitter.displayName,
      },
      retriever: {
        id: dropy.retriever.id,
        username: dropy.retriever.username,
        avatarUrl: dropy.retriever.avatarUrl,
        displayName: dropy.retriever.displayName,
      },
    };
  });
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

export async function getUnretrievedDropyInfos(dropyId: number): Promise<DropyAround & { emitter: SimplifiedUser }> {
  const dropy = await client.dropy.findUnique({
    where: { id: dropyId },
    include: { emitter: true, retriever: true },
  });

  if (dropy == undefined) {
    throw new HttpException(404, `Dropy with id ${dropyId} not found`);
  }

  if (dropy.retrieverId != null) {
    throw new HttpException(403, `Dropy with id ${dropyId} has already been retrieved`);
  }

  return {
    id: dropy.id,
    latitude: dropy.latitude,
    longitude: dropy.longitude,
    emitterId: dropy.emitterId,
    creationDate: dropy.creationDate,
    premium: dropy.emitter.isPremium,
    ambassador: dropy.emitter.isAmbassador,
    emitter: {
      id: dropy.emitter.id,
      username: dropy.emitter.username,
      avatarUrl: dropy.emitter.avatarUrl,
      displayName: dropy.emitter.displayName,
    },
  };
}
