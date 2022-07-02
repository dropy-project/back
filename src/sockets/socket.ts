import { Server } from 'socket.io';

import { logStartedService } from '@/utils/logs.utils';

import { HttpException } from '@/exceptions/HttpException';
import { SocketResponse } from '@/interfaces/socket.interface';

const socketPort = Number(process.env.SOCKET_PORT) || 4000;

const io = new Server(socketPort);

logStartedService('Dropy Socket', socketPort);

export default io;

export function createSocketError(error): SocketResponse<null> {
  if (error instanceof HttpException) {
    return { status: error.status, error: error.message };
  } else {
    console.error(`[Socket error] >> SERVER SIDE ERROR`, error);
    return { status: 500, error: 'Internal server error' };
  }
}
