import client from '@/client';
import { HttpException } from '@/exceptions/HttpException';
import { DropyWithUsers } from '@/interfaces/dropy.interface';
import { uploadPrivateContent } from '@/utils/content.utils';
import { GEOHASH_SIZE } from '@/utils/geolocation.utils';
import { ChatConversation, Dropy, MediaType, User } from '@prisma/client';
import Geohash from 'ngeohash';

export async function retrieveDropy(user: User, dropyId: number): Promise<[DropyWithUsers, string]> {
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

  if (user.id === emitter.id) {
    throw new HttpException(403, `User with id ${user.id} cannot retrieve his own dropy`);
  }

  if (user.energy <= 0) {
    throw new HttpException(406, `User with emitterid ${dropy.emitterId} has not enough energy`);
  }

  const newDropy = await client.dropy.update({
    where: { id: dropy.id },
    data: { retriever: { connect: { id: user.id } }, retrieveDate: new Date() },
  });

  const dropyWithUsers: DropyWithUsers = {
    id: newDropy.id,
    conversationId: dropy.chatConversationId,
    latitude: newDropy.latitude,
    longitude: newDropy.longitude,
    mediaType: newDropy.mediaType,
    mediaUrl: newDropy.mediaUrl,
    creationDate: newDropy.creationDate,
    retrieveDate: newDropy.retrieveDate,
    retriever: {
      id: user.id,
      username: user.username,
      avatarUrl: user.avatarUrl,
      displayName: user.displayName,
    },
    emitter: {
      id: emitter.id,
      username: emitter.username,
      avatarUrl: emitter.avatarUrl,
      displayName: emitter.displayName,
    },
  };

  return [dropyWithUsers, dropy.geohash];
}

export async function createDropy(
  user: User,
  latitude: number,
  longitude: number,
  rawMediaType: string,
  content: string | Buffer,
  Authorization: string,
): Promise<Dropy> {
  const mediaType: MediaType = MediaType[rawMediaType.toUpperCase()];
  if (mediaType == undefined) {
    throw new HttpException(400, `Invalid mediaType ${rawMediaType}`);
  }
  const dropy = await client.dropy.create({
    data: {
      emitterId: user.id,
      latitude,
      longitude,
      mediaType,
      geohash: Geohash.encode_int(latitude, longitude, GEOHASH_SIZE).toString(),
    },
  });

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

export async function linkConversationToDropy(dropy: Dropy): Promise<ChatConversation> {
  if (dropy.emitterId == undefined || dropy.retrieverId == undefined) {
    throw 'Cant link a conversatin to a Dropy that has no emitter or retriever';
  }
  const existingConversation = await client.chatConversation.findFirst({
    where: {
      users: {
        every: {
          OR: [{ id: dropy.retrieverId }, { id: dropy.emitterId }],
        },
      },
    },
  });

  const existingMessageWithThisDropy = await client.chatMessage.findFirst({
    where: { dropyId: dropy.id },
  });

  if (existingMessageWithThisDropy != null) {
    throw new HttpException(409, `Dropy with id ${dropy.id} is already linked to a conversation`);
  }

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
}
