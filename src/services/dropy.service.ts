import client from '@/prisma/client';
import { HttpException } from '@/exceptions/HttpException';
import { DropyAround } from '@/interfaces/dropy.interface';
import { Dropy, MediaType, User } from '@prisma/client';
import { UploadedFile } from 'express-fileupload';
import { sendPushNotificationToUsers } from '@/notification';

const DISTANCE_FILTER_RADIUS = 0.004; // Environ 300m

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

export async function findAround(user: User, latitude: number, longitude: number): Promise<DropyAround[]> {
  const dropies = await getAvailableDropiesAroundLocation(latitude, longitude);

  const dropiesAround = dropies.map(dropy => {
    return {
      id: dropy.id,
      creationDate: dropy.creationDate,
      latitude: dropy.latitude,
      longitude: dropy.longitude,
      isUserDropy: dropy.emitterId == user.id,
    };
  });

  return dropiesAround;
}

export async function retrieveDropy(user: User, dropyId: number) {
  const dropy = await client.dropy.findUnique({ where: { id: dropyId } });

  if (dropy == undefined) {
    throw new HttpException(404, `Dropy with dropyid ${dropyId} not found`);
  }

  if (dropy.retrieverId != null) {
    throw new HttpException(403, `Dropy with dropyid ${dropyId} has already been retreived`);
  }

  const emitter = await client.user.findUnique({ where: { id: dropy.emitterId } });

  if (emitter == undefined) {
    throw new HttpException(404, `User with emitterid ${dropy.emitterId} not found`);
  }

  await client.dropy.update({
    where: {
      id: dropy.id,
    },
    data: {
      retrieverId: user.id,
      retrieveDate: new Date(),
    },
  });

  const chatConversations = await client.chatConversation.findFirst({
    where: {
      users: {
        every: {
          OR: [
            {
              id: user.id,
            },
            {
              id: emitter.id,
            },
          ],
        },
      },
    },
  });

  console.log('CONV FOUND: ', chatConversations);

  if (chatConversations != null) {
    await client.chatConversation.update({
      where: { id: chatConversations.id },
      data: {
        dropies: {
          connect: {
            id: dropy.id,
          },
        },
      },
    });

    await client.chatMessage.create({
      data: {
        senderId: user.id,
        conversationId: chatConversations.id,
        dropyId: dropy.id,
      },
    });
  } else {
    const newConversation = await client.chatConversation.create({
      data: {
        users: { connect: [{ id: user.id }, { id: emitter.id }] },
        dropies: { connect: { id: dropy.id } },
      },
    });
    await client.chatMessage.create({
      data: {
        senderId: user.id,
        conversationId: newConversation.id,
        dropyId: dropy.id,
      },
    });
    sendPushNotificationToUsers([emitter], `Start chating with him`, `${user.displayName} just found your dropy !`);
  }
}

export async function getDropyById(dropyId: number): Promise<Dropy> {
  const dropy = await client.dropy.findUnique({ where: { id: dropyId } });

  if (dropy == undefined) {
    throw new HttpException(404, `Dropy with id ${dropyId} not found`);
  }

  return dropy;
}

export async function getAvailableDropiesAroundLocation(latitude: number, longitude: number, user: User = undefined): Promise<Dropy[]> {
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
  });
}

export async function getDropy(dropyId: number) {
  const dropy = await client.dropy.findUnique({ where: { id: dropyId } });

  if (dropy == undefined) {
    throw new HttpException(404, `Dropy with id ${dropyId} not found`);
  }

  const customDropy = {
    id: dropy.id,
    mediaType: dropy.mediaType,
    creationDate: dropy.creationDate,
    emitterId: dropy.emitterId,
    emitterDisplayName: (await client.user.findUnique({ where: { id: dropy.emitterId } })).displayName,
    retrieverId: dropy.retrieverId,
    retrieverDisplayName: (await client.user.findUnique({ where: { id: dropy.retrieverId } })).displayName,
  };

  return customDropy;
}

export async function findDropiesAround(): Promise<DropyAround[]> {
  const dropies = await client.dropy.findMany({
    where: {
      retrieverId: {
        equals: null,
      },
    },
  });

  const dropiesAround = dropies.map(dropy => {
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
