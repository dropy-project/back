import { Request } from 'express';
import { User } from '@prisma/client';

export interface DataStoredInToken {
  userId: number;
}

export interface TokenData {
  token: string;
  expiresIn: number;
}

export interface AuthenticatedRequest extends Request {
  user: User;
}
