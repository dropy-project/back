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

export interface ResetPasswordToken {
  resetPasswordToken: string;
  expires: number;
}

export interface DataStoredInResetPasswordToken {
  userId: number;
  avatarUrl: string;
  username: string;
  displayName: string;
}

export interface AuthenticatedRequest extends Request {
  user: User;
}

export interface AuthenticatedSocket extends Socket {
  user: User;
}
