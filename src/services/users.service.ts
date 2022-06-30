import { Dropy, User } from '@prisma/client';
import client from '@/client';
import DropyService from './dropy.service';
import { sendPushNotificationToUsers } from '../notification';

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

  public changeDeviceToken = async (user: User, deviceToken: string): Promise<void> => {
    await client.user.update({
      where: {
        id: user.id,
      },
      data: {
        deviceToken,
      },
    });
  };
}
export default UserService;
