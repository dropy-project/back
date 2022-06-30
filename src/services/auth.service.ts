import client from '@/client';
import jwt from 'jsonwebtoken';
import { User } from '@prisma/client';
import { HttpException } from '@exceptions/HttpException';
import { DataStoredInToken, TokenData } from '@interfaces/auth.interface';

const ONE_MONTH_IN_SECONDS = 2592000;

const ONE_DAY_IN_SECONDS = 86400;

class AuthService {
  public async register(uid, displayName): Promise<User> {
    const findUser: User = await client.user.findUnique({ where: { uid: uid } });
    if (findUser) throw new HttpException(409, `This uid ${uid} is already registered`);

    const username: string = await this.displayNameToUsername(displayName);
    const createUserData: User = await client.user.create({ data: { displayName, uid, username } });
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

  public async login(uid: string) {
    const user: User = await client.user.findUnique({ where: { uid } });
    if (!user) throw new HttpException(409, 'No user found with this uid');

    const authTokenData = this.createUserToken(user, ONE_DAY_IN_SECONDS);
    const refreshTokenData = this.createUserToken(user, ONE_MONTH_IN_SECONDS);

    return { authTokenData, refreshTokenData, user };
  }

  public async refreshAuthToken(refreshToken: string) {
    const secretKey = process.env.SECRET_KEY;
    const { userId } = (await jwt.verify(refreshToken, secretKey)) as DataStoredInToken;

    const user = await client.user.findUnique({ where: { id: userId } });
    const token = this.createUserToken(user, ONE_DAY_IN_SECONDS);

    return { token };
  }

  private createUserToken(user: User, expiresIn: number): TokenData {
    const dataStoredInToken: DataStoredInToken = { userId: user.id };
    const secretKey = process.env.SECRET_KEY;
    return { expiresIn, token: jwt.sign(dataStoredInToken, secretKey, { expiresIn }) };
  }
}

export default AuthService;
