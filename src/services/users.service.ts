import { ChatMessage, Dropy, User } from '@prisma/client';
import { getAvailableDropiesAroundLocation } from '@/services/dropy.service';
import { sendPushNotification } from '../notification';
import client from '@/prisma/client';
import { UserConversation } from '@/interfaces/chat.interface';
import { getDistanceFromLatLonInMeters } from '@/utils/notification.utils';

const DISTANCE_FILTER_RADIUS = 50;
const TIME_FILTER_MINUTES = 60 * 24;

export async function backgroundGeolocationPing(user: User, latitude: number, longitude: number, timeStamp: Date): Promise<Dropy[]> {
  const dropies = await getAvailableDropiesAroundLocation(latitude, longitude, user);
  const sendNotification = await checkTimeAndDistanceBetweenNotifications(user, latitude, longitude, timeStamp);
  await client.user.update({
    where: {
      id: user.id,
    },
    data: {
      lastGeolocationPingDate: timeStamp,
      lastGeolocationPingLatitude: latitude,
      lastGeolocationPingLongitude: longitude,
    },
  });

  if (dropies.length > 0 && sendNotification) {
    sendPushNotification({
      user,
      title: 'Drop found near your position!',
      body: 'Open the app to see it',
      sound: 'dropy_sound.mp3',
    });
  }

  return dropies;
}

export async function checkTimeAndDistanceBetweenNotifications(user: User, latitude: number, longitude: number, timeStamp: Date): Promise<Boolean> {
  const { lastGeolocationPingDate, lastGeolocationPingLatitude, lastGeolocationPingLongitude } = user;
  const distance = getDistanceFromLatLonInMeters(latitude, longitude, lastGeolocationPingLatitude, lastGeolocationPingLongitude);
  const timeDifference = timeStamp.getTime() - lastGeolocationPingDate.getTime();
  const timeDifferenceInMinutes = timeDifference / (1000 * 60);
  return distance > DISTANCE_FILTER_RADIUS || timeDifferenceInMinutes > TIME_FILTER_MINUTES;
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
        displayName: otherUser.displayName,
      },
    };
  });
}
