import { sign } from 'jsonwebtoken';
import { User } from '@prisma/client';
import { HttpException } from '@exceptions/HttpException';
import { DataStoredInToken, TokenData } from '@interfaces/auth.interface';
import { UserAuthDTO } from '@/dtos/users.dto';
import client from '@/client';

const ONE_MONTH_IN_SECONDS = 2592000;

class AuthService {
  public async register(userData: UserAuthDTO): Promise<User> {
    if (userData.uid == null || userData.displayName == null) {
      throw new HttpException(400, 'No user data provided');
    }

    const findUser: User = await client.user.findUnique({ where: { uid: userData.uid } });
    if (findUser) throw new HttpException(409, `This uid ${userData.uid} is already registered`);

    const username: string = await this.displayNameToUsername(userData.displayName);
    const createUserData: User = await client.user.create({ data: { ...userData, username: username } });
    return createUserData;
  }

  public async displayNameToUsername(displayName: string): Promise<string> {
    const username: string = displayName.toLowerCase().trim().normalize('NFD');
    const cleanedUsername = username
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s/g, '_')
      .replace(/[^\w\s]/gi, '');

    let count = 0;
    let uniqueUsername = cleanedUsername;
    while (await client.user.findUnique({ where: { username: uniqueUsername } })) {
      uniqueUsername = username + count.toString();
      count++;
    }
    return uniqueUsername;
  }

  public async login(userData: UserAuthDTO): Promise<{ cookie: string; findUser: User }> {
    if (userData.uid == null) {
      throw new HttpException(400, 'No user data provided');
    }

    const findUser: User = await client.user.findUnique({ where: { uid: userData.uid } });
    if (!findUser) throw new HttpException(409, 'No user found with this uid');

    const tokenData = this.createToken(findUser);
    const cookie = this.createCookie(tokenData);

    return { cookie, findUser };
  }

  public createToken(user: User): TokenData {
    const dataStoredInToken: DataStoredInToken = { userId: user.id };
    const secretKey = process.env.SECRET_KEY;
    const expiresIn = ONE_MONTH_IN_SECONDS;

    return { expiresIn, token: sign(dataStoredInToken, secretKey, { expiresIn }) };
  }

  public createCookie(tokenData: TokenData): string {
    return `Authorization=${tokenData.token}; HttpOnly; Max-Age=${tokenData.expiresIn};`;
  }
}

export default AuthService;
