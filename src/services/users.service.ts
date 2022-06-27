import { User } from '@prisma/client';
import client from '@/client';
import { HttpException } from '@/exceptions/HttpException';
import DropyService from './dropy.service';
import notification from '../notification';

class UserService {
  public async findAllUser(): Promise<User[]> {
    const allUser: User[] = await client.user.findMany();
    return allUser;
  }

  public backgroundGeolocationPing = async (userId: number, currentPositionLatitude: number, currentPositionLongitude: number, timeStamp: Date): Promise<Dropy[]> => {
    const user = await client.user.findUnique({ where: { id: userId } });
    if (user == undefined) {
      throw new HttpException(404, `User with id ${userId} not found`);
    }

    const dropies = await DropyService.getDropiesAroundAPosition(currentPositionLatitude, currentPositionLongitude);
    await client.user.update({
      where: {
        id: user.id,
      },
      data: {
        lastSeenDate: timeStamp,
        lastSeenPositionLatitude: currentPositionLatitude,
        lastSeenPositionLongitude: currentPositionLongitude,
      },
    });

    if (dropies.length > 0) {
      notification.sendPush([user], "ÇA POUSSE FORT ICI");
    };

    return dropies;
  }

  public changeDeviceToken = async (userId: number, deviceToken: string): Promise<User> => {
    const user = await client.user.findUnique({ where: { id: userId } });
    if (user == undefined) {
      throw new HttpException(404, `User with id ${userId} not found`);
    }

    await client.user.update({
      where: {
        id: userId,
      },
      data: {
        deviceToken: deviceToken,
      },
    });

    return user;

  }
}
export default UserService;
