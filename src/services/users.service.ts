import { ChatMessage, Dropy, User } from '@prisma/client';
import client from '@/client';
import DropyService from './dropy.service';
import { sendPushNotificationToUsers } from '../notification';
import { UserConversation } from '@/interfaces/chat.interface';

class UserService {
  public backgroundGeolocationPing = async (user: User, latitude: number, longitude: number, timeStamp: Date): Promise<Dropy[]> => {
    const dropies = await DropyService.getAvailableDropiesAroundLocation(latitude, longitude, user);
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
  };

  public updateDeviceToken = async (user: User, deviceToken: string): Promise<void> => {
    await client.user.update({
      where: {
        id: user.id,
      },
      data: {
        deviceToken,
      },
    });
  };

  public conversations = async (userId: number): Promise<UserConversation[]> => {
    const userConversations = await client.chatConversation.findMany({
      where: {
        users: {
          some: {
            id: userId,
          },
        },
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
  };
}
export default UserService;
