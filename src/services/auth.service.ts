import { sign } from 'jsonwebtoken';
import { User } from '@prisma/client';
import { HttpException } from '@exceptions/HttpException';
import { DataStoredInToken, TokenData } from '@interfaces/auth.interface';
import { UserAuthDTO } from '@/dtos/users.dto';
import client from '@/client';
import { Request } from 'express';
import { getUserIdFromToken } from '@/utils/auth.utils';

const ONE_MONTH_IN_SECONDS = 2592000;

const ONE_DAY_IN_SECONDS = 86400;

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
    const refreshTokenData = this.createRefreshToken(findUser);
    const cookie = "Authorization" + this.createCookie(tokenData) + ';RefreshToken' + this.createCookie(refreshTokenData);
    return { cookie, findUser };
  }

  public createToken(user: User): TokenData {
    const dataStoredInToken: DataStoredInToken = { userId: user.id };
    const secretKey = process.env.SECRET_KEY;
    const expiresIn = ONE_DAY_IN_SECONDS;
    return { expiresIn, token: sign(dataStoredInToken, secretKey, { expiresIn }) };
  }

  public createRefreshToken(user: User): TokenData {
    const dataStoredInToken: DataStoredInToken = { userId: user.id };
    const secretKey = process.env.SECRET_KEY;
    const expiresIn = ONE_MONTH_IN_SECONDS;

    return { expiresIn, token: sign(dataStoredInToken, secretKey, { expiresIn }) };
  }

  

  public createCookie(tokenData : TokenData) :string {
    return `=${tokenData.token}; HttpOnly; Max-Age=${tokenData.expiresIn}`;
  }

  

  public async refreshAuthToken(req : Request): Promise<{ cookie: string }> {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) throw new HttpException(401, 'No refresh token provided');
    const userId = await getUserIdFromToken(refreshToken);
    const user = await client.user.findUnique({ where: { id: userId } });
    if (!user) throw new HttpException(401, 'No user found with this refresh token');
    const tokenData = this.createToken(user);
    const cookie = this.createCookie(tokenData);
    
    return { cookie };
  }


}

export default AuthService;
