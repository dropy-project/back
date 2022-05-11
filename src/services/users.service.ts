import { hash } from 'bcrypt';
import { PrismaClient, User } from '@prisma/client';
import { CreateUserDto } from '@dtos/users.dto';
import { HttpException } from '@exceptions/HttpException';
import { isEmpty } from '@utils/util';

class UserService {
  public users = new PrismaClient().user;

  public async findAllUser(): Promise<User[]> {
    const allUser: User[] = await this.users.findMany();
    return allUser;
  }

  public async findUserById(userId: number): Promise<User> {
    if (isEmpty(userId)) throw new HttpException(400, "You're not userId");

    const findUser: User = await this.users.findUnique({ where: { id: userId } });
    if (!findUser) throw new HttpException(409, "You're not user");

    return findUser;
  }

  public async createUser(userData: CreateUserDto): Promise<User> {
    if (isEmpty(userData)) throw new HttpException(400, "You're not userData");

    const findUser: User = await this.users.findUnique({ where: { UID: userData.UID } });
    if (findUser) throw new HttpException(409, `You're UID ${userData.UID} already exists`);

    const creationDate: Date = new Date();
    const userName: string = await this.displayNameToUsername(userData.displayName);
    const createUserData: User = await this.users.create({ data: { ...userData, userName: userName, registerDate: creationDate } });
    return createUserData;
  }
  //test comment
  public async displayNameToUsername(displayName: string): Promise<string> {
    const userName: string = displayName.toLowerCase();
    userName.replace(/\s/g, '_');
    let count = 0;
    let uniqueUserName: string = userName;
    while (await this.users.findUnique({ where: { userName: uniqueUserName } })) {
      uniqueUserName = userName + count.toString();
      count++;
    }
    return uniqueUserName;
  }

  // public async updateUser(userId: number, userData: CreateUserDto): Promise<User> {
  //   if (isEmpty(userData)) throw new HttpException(400, "You're not userData");

  //   const findUser: User = await this.users.findUnique({ where: { id: userId } });
  //   if (!findUser) throw new HttpException(409, "You're not user");

  //   const hashedPassword = await hash(userData.password, 10);
  //   const updateUserData = await this.users.update({ where: { id: userId }, data: { ...userData, password: hashedPassword } });
  //   return updateUserData;
  // }

  // public async deleteUser(userId: number): Promise<User> {
  //   if (isEmpty(userId)) throw new HttpException(400, "You're not userId");

  //   const findUser: User = await this.users.findUnique({ where: { id: userId } });
  //   if (!findUser) throw new HttpException(409, "You're not user");

  //   const deleteUserData = await this.users.delete({ where: { id: userId } });
  //   return deleteUserData;
  // }
}

export default UserService;
