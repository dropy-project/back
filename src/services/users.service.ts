import { PrismaClient, User } from '@prisma/client';
import { HttpException } from '@exceptions/HttpException';

class UserService {
  public users = new PrismaClient().user;

  public async findAllUser(): Promise<User[]> {
    const allUser: User[] = await this.users.findMany();
    return allUser;
  }

  public async findUserById(userId: number): Promise<User> {
    if (userId == null) throw new HttpException(400, 'the userId parameter is required');

    const findUser: User = await this.users.findUnique({ where: { id: userId } });
    if (!findUser) throw new HttpException(409, 'No user found with this id');

    return findUser;
  }

  public async findUserByUID(userUID: string): Promise<User> {
    if (userUID == null) throw new HttpException(400, 'the userId parameter is required');

    const findUser: User = await this.users.findUnique({ where: { uid: userUID } });
    if (!findUser) throw new HttpException(409, 'No user found');

    return findUser;
  }
}
export default UserService;
