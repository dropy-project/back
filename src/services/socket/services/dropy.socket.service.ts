import client from '@/client';
import { HttpException } from '@/exceptions/HttpException';
import { DropyAround } from '@/interfaces/dropy.interface';
import { sendPushNotification } from '@/notification';
import { getAvailableDropiesAroundLocation } from '@/utils/geolocation.utils';
import { ChatConversation, Dropy, User } from '@prisma/client';

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

export async function createDropy(user: User, latitude, longitude): Promise<Dropy> {
  const dropy = client.dropy.create({ data: { emitterId: user.id, latitude, longitude } });
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
