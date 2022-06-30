import client from '@/client';
import { Dropy, User } from '@prisma/client';
import DropyService from './dropy.service';

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

    //TODO : link to the notification system if size > 0
    return dropies;
  };
}
export default UserService;
