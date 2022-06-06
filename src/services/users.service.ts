import { User } from '@prisma/client';
import { HttpException } from '@exceptions/HttpException';
import client from '@/client';

class UserService {
  public async findAllUser(): Promise<User[]> {
    const allUser: User[] = await client.user.findMany();
    return allUser;
  }

  public async findUserById(userId: number): Promise<User> {
    if (userId == null) throw new HttpException(400, 'the userId parameter is required');

    const findUser: User = await client.user.findUnique({ where: { id: userId } });
    if (!findUser) throw new HttpException(409, 'No user found with this id');

    return findUser;
  }
}
export default UserService;
