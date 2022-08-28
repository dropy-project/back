import client from '@/client';
import fs from 'fs';
import { HttpException } from '@exceptions/HttpException';
import { DropyAround } from '@interfaces/dropy.interface';
import { ChatConversation, Dropy, MediaType, User } from '@prisma/client';
import { UploadedFile } from 'express-fileupload';
import { sendPushNotification } from '@services/api/notification';
import { getAvailableDropiesAroundLocation } from '@utils/geolocation.utils';

export async function createDropy(user: User, latitude, longitude): Promise<Dropy> {
  const dropy = client.dropy.create({ data: { emitterId: user.id, latitude, longitude } });
  return dropy;
}

export async function createDropyMedia(user: User, dropyId: number, mediaPayload: UploadedFile | string, mediaType: MediaType) {
  const dropy = await client.dropy.findUnique({ where: { id: dropyId } });

  if (dropy == undefined) {
    throw new HttpException(404, `Dropy with id ${dropyId} not found`);
  }

  if (dropy.emitterId != user.id) {
    throw new HttpException(403, `User is not allowed to add a media for this dropy`);
  }

  if (dropy.mediaType !== MediaType.NONE) {
    throw new HttpException(409, `Dropy with id ${dropyId} has already a linked media`);
  }

  const isFile = (mediaPayload as UploadedFile).data != undefined;

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
    const file = mediaPayload as UploadedFile;

    const extensionFile = file.mimetype.split('/').pop();

    const fileName = `${dropy.creationDate.getFullYear()}_${dropy.creationDate.getMonth()}_${dropy.creationDate.getDay()}_${mediaType}_${dropyId}.${extensionFile}`;

    const filePath = `${process.cwd()}/public/dropiesMedias/${fileName}`;
    file.mv(filePath);
    await client.dropy.update({
      where: { id: dropyId },
      data: { filePath: filePath, mediaType: mediaType },
    });
  } else {
    await client.dropy.update({
      where: { id: dropyId },
      data: { mediaData: mediaPayload as string, mediaType: mediaType },
    });
  }
}

export async function retrieveDropy(user: User, dropyId: number) {
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
}

export async function getDropyById(dropyId: number): Promise<Dropy> {
  const dropy = await client.dropy.findUnique({ where: { id: dropyId } });

  if (dropy == undefined) {
    throw new HttpException(404, `Dropy with id ${dropyId} not found`);
  }

  return dropy;
}

export async function getDropy(dropyId: number) {
  const dropy = await client.dropy.findUnique({
    where: { id: dropyId },
    include: { emitter: true, retriever: true },
  });

  if (dropy == undefined) {
    throw new HttpException(404, `Dropy with id ${dropyId} not found`);
  }

  const customDropy = {
    id: dropy.id,
    mediaType: dropy.mediaType,
    creationDate: dropy.creationDate,
    emitterId: dropy.emitterId,
    emitterDisplayName: dropy.emitter.displayName,
    retrieverId: dropy.retrieverId,
    retrieverDisplayName: dropy.retriever.displayName,
    conversationId: dropy.chatConversationId,
  };

  return customDropy;
}

export async function findDropiesAround(user: User, latitude: number, longitude: number): Promise<DropyAround[]> {
  const dropies = await getAvailableDropiesAroundLocation(latitude, longitude);

  const userWithBlockedUsers = await client.user.findUnique({
    where: { id: user.id },
    include: { blockedUsers: true },
  });

  const blockedUsersId = userWithBlockedUsers.blockedUsers.map(users => users.id);

  const cleanedDropies = dropies
    .filter(dropy => dropy.emitter.isBanned == false || dropy.emitterId === user.id)
    .filter(dropy => !blockedUsersId.includes(dropy.emitterId));

  const dropiesAround = cleanedDropies.map(dropy => {
    return {
      id: dropy.id,
      creationDate: dropy.creationDate,
      latitude: dropy.latitude,
      longitude: dropy.longitude,
      emitterId: dropy.emitterId,
    };
  });

  return dropiesAround;
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

export async function userEmittedDropies(user: User): Promise<Dropy[]> {
  const userDropies = await client.dropy.findMany({
    where: { emitterId: user.id },
    orderBy: { creationDate: 'desc' },
  });

  return userDropies;
}

export async function deleteDropy(dropyId: number, user: User): Promise<void> {
  const dropy = await client.dropy.findUnique({ where: { id: dropyId } });

  if (dropy == undefined) {
    throw new HttpException(404, `Dropy with id ${dropyId} not found`);
  }

  if (user.id != dropy.emitterId) {
    throw new HttpException(403, `You can't delete this dropy`);
  }

  if (dropy.mediaType === MediaType.PICTURE || dropy.mediaType === MediaType.VIDEO) {
    fs.unlinkSync(dropy.filePath);
  }

  await client.dropy.delete({ where: { id: dropyId } });
}
