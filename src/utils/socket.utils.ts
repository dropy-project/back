import { AuthenticatedSocket } from '@/interfaces/auth.interface';
import { User } from '@prisma/client';
import { Namespace } from 'socket.io';

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
