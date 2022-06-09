import { User } from '@prisma/client';
import client from '@/client';

class UserService {
  public async findAllUser(): Promise<User[]> {
    const allUser: User[] = await client.user.findMany();
    return allUser;
  }
}
export default UserService;
