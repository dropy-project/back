import client from '@/client';
import { HttpException } from '@/exceptions/HttpException';
import { DropyAround } from '@/interfaces/dropy.interface';
import { sendPushNotification } from '@/notification';
import { uploadPrivateContent } from '@/utils/content.utils';
import { GEOHASH_SIZE } from '@/utils/geolocation.utils';
import { ChatConversation, Dropy, MediaType, User } from '@prisma/client';
import Geohash from 'ngeohash';

export async function retrieveDropy(user: User, dropyId: number): Promise<Dropy> {
  const dropy = await client.dropy.findUnique({ where: { id: dropyId } });

  if (dropy == undefined) {
    throw new HttpException(404, `Dropy with dropyid ${dropyId} not found`);
  }

  if (dropy.retrieverId != null) {
    throw new HttpException(403, `Dropy with dropyid ${dropyId} has already been retrieved`);
  }

  const emitter = await client.user.findUnique({ where: { id: dropy.emitterId } });

  if (emitter == undefined) {
    throw new HttpException(404, `User with emitterid ${dropy.emitterId} not found`);
  }

  const newDropy = await client.dropy.update({
    where: { id: dropy.id },
    data: { retriever: { connect: { id: user.id } }, retrieveDate: new Date() },
  });

  const conversation = await createOrUpdateChatConversation(newDropy);

  sendPushNotification({
    user: emitter,
    title: `${user.displayName} just found your drop !`,
    body: 'Start chating with him !',
    sound: 'message_sound.mp3',
    payload: conversation,
  });

  return newDropy;
}

export async function createDropy(
  user: User,
  latitude: number,
  longitude: number,
  rawMediaType: string,
  content: string | Buffer,
  Authorization: string,
): Promise<Dropy> {
  const dropy = await client.dropy.create({
    data: {
      emitterId: user.id,
      latitude,
      longitude,
      geohash: Geohash.encode_int(latitude, longitude, GEOHASH_SIZE).toString(),
    },
  });

  if (dropy.emitterId != user.id) {
    throw new HttpException(403, `User is not allowed to add a media for this dropy`);
  }

  const mediaType: MediaType = MediaType[rawMediaType.toUpperCase()];

  if (dropy.mediaType !== MediaType.NONE) {
    throw new HttpException(409, `Dropy with id ${dropy.id} has already a linked media`);
  }

  const isFile = (content as Buffer).buffer != undefined;

  if (isFile) {
    if (mediaType == MediaType.TEXT || mediaType == MediaType.MUSIC) {
      throw new HttpException(406, `MediaType ${mediaType} cannot have a text or music ressource as media`);
    }
  } else {
    if (mediaType == MediaType.PICTURE || mediaType == MediaType.VIDEO) {
      throw new HttpException(406, `MediaType ${mediaType} cannot have a file as media`);
    }
  }

  if (isFile) {
    const file = content as Buffer;

    const { fileUrl, accessToken } = await uploadPrivateContent(file, Authorization);

    await client.dropy.update({
      where: { id: dropy.id },
      data: { mediaUrl: `${fileUrl}?accessToken=${accessToken}`, mediaType: mediaType },
    });
  } else {
    await client.dropy.update({
      where: { id: dropy.id },
      data: { mediaData: content as string, mediaType: mediaType },
    });
  }

  return dropy;
}

const createOrUpdateChatConversation = async (dropy: Dropy): Promise<ChatConversation> => {
  const existingConversation = await client.chatConversation.findFirst({
    where: {
      users: {
        every: {
          OR: [{ id: dropy.retrieverId }, { id: dropy.emitterId }],
        },
      },
    },
  });

  const sendDropyAsMessage = async (conversationId: number) => {
    await client.chatMessage.create({
      data: {
        senderId: dropy.emitterId,
        conversationId: conversationId,
        dropyId: dropy.id,
      },
    });
  };

  if (existingConversation != null) {
    await client.chatConversation.update({
      where: { id: existingConversation.id },
      data: {
        dropies: { connect: { id: dropy.id } },
        closed: false,
      },
    });
    await sendDropyAsMessage(existingConversation.id);
    return existingConversation;
  } else {
    const newConversation = await client.chatConversation.create({
      data: {
        users: { connect: [{ id: dropy.retrieverId }, { id: dropy.emitterId }] },
        dropies: { connect: { id: dropy.id } },
      },
    });
    await sendDropyAsMessage(newConversation.id);
    return newConversation;
  }
};

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
