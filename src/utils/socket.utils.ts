import { AuthenticatedSocket } from '@/interfaces/auth.interface';
import { User } from '@prisma/client';
import { Namespace } from 'socket.io';

import { HttpException } from '@/exceptions/HttpException';
import { SocketResponse } from '@/interfaces/socket.interface';
import { isNotAFunction } from './controller.utils';

export async function getUsersSockets(namespace: Namespace, users: User[]): Promise<AuthenticatedSocket[]> {
  const sockets = await namespace.fetchSockets();

  const remoteSockets = sockets.filter((socket: unknown) => {
    return users.some(user => user.id === (socket as AuthenticatedSocket).user.id);
  });

  return remoteSockets.map(socket => {
    return socket as unknown as AuthenticatedSocket;
  });
}

export async function getRoomConnectedUsers(namespace: Namespace, roomId: string): Promise<User[]> {
  const sockets = await namespace.in(roomId).fetchSockets();
  const connectedUsers = sockets.map(socket => (socket as unknown as AuthenticatedSocket).user);
  return connectedUsers;
}

export function handleSocketRawError(callback, error) {
  const socketError = createSocketError(error);
  if (!isNotAFunction(callback)) callback(socketError);
}

export function createSocketError(error): SocketResponse<null> {
  if (error instanceof HttpException) {
    return { status: error.status, error: error.message };
  } else {
    console.error(`[Socket error] >> SERVER SIDE ERROR`, error);
    return { status: 500, error: 'Internal server error' };
  }
}
