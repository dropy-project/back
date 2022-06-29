import client from '@/client';
import { Dropy } from '@prisma/client';
import { HttpException } from '@/exceptions/HttpException';
import DropyService from './dropy.service';

class UserService {
  public backgroundGeolocationPing = async (
    userId: number,
    currentPositionLongitude: number,
    currentPositionLatitude: number,
    timeStamp: Date,
  ): Promise<Dropy[]> => {
    const user = await client.user.findUnique({ where: { id: userId } });
    if (user == undefined) {
      throw new HttpException(404, `User with id ${userId} not found`);
    }

    const dropies = await DropyService.getAvailableDropiesAroundLocation(currentPositionLatitude, currentPositionLongitude, user);
    await client.user.update({
      where: {
        id: user.id,
      },
      data: {
        lastSeenDate: timeStamp,
        lastSeenLocationLatitude: currentPositionLatitude,
        lastSeenLocationLongitude: currentPositionLongitude,
      },
    });

    //TODO : link to the notification system if size > 0
    return dropies;
  };
}
export default UserService;
