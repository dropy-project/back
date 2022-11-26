import { NextFunction } from 'express';
import { Namespace } from 'socket.io';
import { getUsersSockets } from '@/utils/socket.utils';
import { AuthenticatedSocket } from '@/interfaces/auth.interface';

const doubleSocketMiddleware = async (socket: AuthenticatedSocket, namespace: Namespace, next : NextFunction) => {
  try {
    const sockets = await getUsersSockets(namespace, [socket.user]);
    if (sockets.length > 1) {
      socket.disconnect();
    }
    next();
  } catch (error) {
    console.log('ERROR : Somebody is connecting using two devices');
    next();
  }
};

export default doubleSocketMiddleware;
