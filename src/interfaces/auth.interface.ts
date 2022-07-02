import { Request } from 'express';
import { User } from '@prisma/client';
import { Socket } from 'socket.io';

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

export interface AuthenticatedSocket extends Socket {
  user: User;
}
