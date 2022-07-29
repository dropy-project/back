import { Request } from 'express';
import { User } from '@prisma/client';
import { Socket } from 'socket.io';

export interface DataStoredInToken {
  userId: number;
}

export interface UserTokens {
  accessToken: string;
  refreshToken: string;
  expires: number;
}

export interface AuthenticatedRequest extends Request {
  user: User;
}

export interface AuthenticatedSocket extends Socket {
  user: User;
}
