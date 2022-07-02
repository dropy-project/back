import { ChatMessage, Dropy, User } from '@prisma/client';
import { getAvailableDropiesAroundLocation } from '@/services/dropy.service';
import { sendPushNotificationToUsers } from '../notification';
import client from '@/prisma/client';
import { UserConversation } from '@/interfaces/chat.interface';

export async function backgroundGeolocationPing(user: User, latitude: number, longitude: number, timeStamp: Date): Promise<Dropy[]> {
  const dropies = await getAvailableDropiesAroundLocation(latitude, longitude, user);
  await client.user.update({
    where: {
      id: user.id,
    },
    data: {
      lastSeenDate: timeStamp,
      lastSeenLocationLatitude: latitude,
      lastSeenLocationLongitude: longitude,
    },
  });

  if (dropies.length > 0) {
    sendPushNotificationToUsers([user], 'Drop found near your position');
  }

  return dropies;
}

export async function updateDeviceToken(user: User, deviceToken: string): Promise<void> {
  await client.user.update({
    where: {
      id: user.id,
    },
    data: {
      deviceToken,
    },
  });
}

export async function conversations(userId: number): Promise<UserConversation[]> {
  const userConversations = await client.chatConversation.findMany({
    where: {
      users: {
        some: {
          id: userId,
        },
      },
      closed: false,
    },
    include: {
      users: true,
      messages: true,
    },
  });

  return userConversations.map(conv => {
    const otherUser = conv.users.find((u: User) => u.id !== userId);
    const lastMessage: ChatMessage = conv.messages.at(-1);

    return {
      id: conv.id,
      isOnline: true,
      isRead: lastMessage?.read ?? false,
      lastMessagePreview: lastMessage?.content ?? null,
      lastMessageDate: lastMessage?.date ?? null,
      user: {
        userId: otherUser.id,
        username: otherUser.username,
      },
    };
  });
}
