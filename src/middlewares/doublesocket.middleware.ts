import { NextFunction } from 'express';
import { Namespace } from 'socket.io';
import { getUsersSockets } from '@/utils/socket.utils';
import { AuthenticatedSocket } from '@/interfaces/auth.interface';

const doubleSocketMiddleware = async (socket: AuthenticatedSocket, namespace: Namespace, next: NextFunction) => {
  try {
    const sockets = await getUsersSockets(namespace, [socket.user]);
    if (sockets.length >= 1) {
      socket.emit('double_connection');
      console.log(`[Double socket] >> ${socket.user.username} has ${sockets.length} sockets`);
    }
    next();
  } catch (error) {
    console.log('Double socket middleware error', error);
    next();
  }
};

export default doubleSocketMiddleware;
