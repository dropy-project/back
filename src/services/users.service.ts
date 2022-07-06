import { ChatMessage, Dropy, User } from '@prisma/client';
import { getAvailableDropiesAroundLocation } from '@/services/dropy.service';
import { sendPushNotificationToUsers } from '../notification';
import client from '@/prisma/client';
import { UserConversation } from '@/interfaces/chat.interface';

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
      lastSeenDate: timeStamp,
      lastSeenLocationLatitude: latitude,
      lastSeenLocationLongitude: longitude,
    },
  });

  if (dropies.length > 0 && sendNotification) {
    sendPushNotificationToUsers([user], 'Drop found near your position');
  }

  return dropies;
}

export async function checkTimeAndDistanceBetweenNotifications(user: User, latitude: number, longitude: number, timeStamp: Date): Promise<Boolean> {
  const lastSeenDate = user.lastSeenDate;
  const lastSeenLocationLatitude = user.lastSeenLocationLatitude;
  const lastSeenLocationLongitude = user.lastSeenLocationLongitude;
  const distance = getDistanceFromLatLonInMeters(latitude, longitude, lastSeenLocationLatitude, lastSeenLocationLongitude);
  const timeDifference = timeStamp.getTime() - lastSeenDate.getTime();
  const timeDifferenceInMinutes = timeDifference / (1000 * 60);
  return distance > DISTANCE_FILTER_RADIUS || timeDifferenceInMinutes > TIME_FILTER_MINUTES;
}

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
