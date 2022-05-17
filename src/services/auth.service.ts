import { sign } from 'jsonwebtoken';
import { PrismaClient, User } from '@prisma/client';
import { SECRET_KEY } from '@config';
import { HttpException } from '@exceptions/HttpException';
import { DataStoredInToken, TokenData } from '@interfaces/auth.interface';
import { isEmpty } from '@utils/util';
import { UserAuthDTO } from '@/dtos/users.dto';

const ONE_MONTH_IN_SECONDS = 2592000;

class AuthService {
  public users = new PrismaClient().user;

  public async register(userData: UserAuthDTO): Promise<User> {
    if (isEmpty(userData)) throw new HttpException(400, 'No user data provided');

    const findUser: User = await this.users.findUnique({ where: { uid: userData.uid } });
    if (findUser) throw new HttpException(409, `This uid ${userData.uid} is already registered`);

    const creationDate: Date = new Date();
    const username: string = await this.displayNameToUsername(userData.displayName);
    const createUserData: User = await this.users.create({ data: { ...userData, username: username, registerDate: creationDate } });
    return createUserData;
  }

  public async displayNameToUsername(displayName: string): Promise<string> {
    const username: string = displayName.toLowerCase();
    const cleanedUsername = username.replace(/\s/g, '_').replace(/[^\w\s]/gi, '');

    let count = 0;
    let uniqueUsername = cleanedUsername;
    while (await this.users.findUnique({ where: { username: uniqueUsername } })) {
      uniqueUsername = username + count.toString();
      count++;
    }
    return uniqueUsername;
  }

  public async login(userData: UserAuthDTO): Promise<{ cookie: string; findUser: User }> {
    if (isEmpty(userData)) throw new HttpException(400, 'No user data provided');

    const findUser: User = await this.users.findUnique({ where: { uid: userData.uid } });
    if (!findUser) throw new HttpException(409, 'No user found with this uid');

    const tokenData = this.createToken(findUser);
    const cookie = this.createCookie(tokenData);

    return { cookie, findUser };
  }

  public createToken(user: UserAuthDTO): TokenData {
    const dataStoredInToken: DataStoredInToken = { id: user.uid };
    const secretKey = SECRET_KEY;
    const expiresIn = ONE_MONTH_IN_SECONDS;

    return { expiresIn, token: sign(dataStoredInToken, secretKey, { expiresIn }) };
  }

  public createCookie(tokenData: TokenData): string {
    return `Authorization=${tokenData.token}; HttpOnly; Max-Age=${tokenData.expiresIn};`;
  }
}

export default AuthService;
