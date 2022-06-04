import { DataStoredInToken } from '@/interfaces/auth.interface';
import { Request } from 'express';
import { verify } from 'jsonwebtoken';

class AuthUtils {
  public getUserIdFromToken = async (req: Request): Promise<number> => {
    const Authorization = req.cookies['Authorization'] || (req.header('Authorization') ? req.header('Authorization').split('Bearer ')[1] : null);

    if (Authorization == null) {
      return null;
    }

    const secretKey = process.env.SECRET_KEY;
    const verificationResponse = (await verify(Authorization, secretKey)) as DataStoredInToken;

    return verificationResponse.userId;
  };
}

export default AuthUtils;
