import { User } from '@prisma/client';
import client from '@/client';
import { HttpException } from '@/exceptions/HttpException';
import DropyService from './dropy.service';

class UserService {
  public async findAllUser(): Promise<User[]> {
    const allUser: User[] = await client.user.findMany();
    return allUser;
  }

  public pingDropy = async (userId: number, currentPositionLatitude: number, currentPositionLongitude: number): Promise<Dropy[]> => {
    const user = await client.user.findUnique({ where: { id: userId } });
    if (user == undefined) {
      throw new HttpException(404, `User with id ${userId} not found`);
    }

    const dropies  =  await DropyService.getDropiesAroundAPosition(currentPositionLatitude, currentPositionLongitude);
    await client.user.update({
      where: {
        id: user.id,
      },
      data: {
        lastSeenDate: new Date(),
        lastSeenPositionLatitude: currentPositionLatitude,
        lastSeenPositionLongitude: currentPositionLongitude,
      },
    });

    //TODO : link to the notification system if size > 0
    return dropies;
  }
}
export default UserService;
