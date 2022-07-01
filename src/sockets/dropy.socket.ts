import { Server, Socket } from 'socket.io';
import { NextFunction, Response } from 'express';
import { DropyAround } from '@/interfaces/dropy.interface';
import DropyService from '@/services/dropy.service';
import DropyController from '@/controllers/dropy.controller';
import { verify } from 'jsonwebtoken';
import { DataStoredInToken } from '@/interfaces/auth.interface';
import client from '@/client';
import { User } from '@prisma/client';

interface ExtendedSocket extends Socket {
  user: User;
}

export function startSocket() {
  const io = new Server(4000);
  const dropyController = new DropyController();

  io.use(async (socket: ExtendedSocket, next: NextFunction) => {
    const authorization = socket.handshake.headers.authorization;

    if (authorization == null) {
      return;
    }

    const secretKey = process.env.SECRET_KEY;
    const { userId } = (await verify(authorization, secretKey)) as DataStoredInToken;

    const user = await client.user.findUnique({ where: { id: userId } });

    if (user == null) {
      return;
    }

    socket.user = user;
    next();
  });

  const dropyService = new DropyService();

  console.log('Start socket');

  const findAll = async (user: User): Promise<DropyAround[]> => {
    try {
      const dropies = await dropyService.findAll(user);
      return dropies;
    } catch (error) {
      return [];
    }
  };

  io.on('connection', async (socket: ExtendedSocket) => {
    console.log(`New connection ${socket.user.displayName} - ${socket.id}`);

    socket.emit('all_dropies_around', await findAll(socket.user));

    socket.on('dropy_created', async (body, createdCb) => {
      const dropyId = await dropyController.createDropy(body, socket.user);
      createdCb(dropyId);
      io.emit('all_dropies_around', await findAll(socket.user));
    });

    socket.on('dropy_retreived', async (dropyId, retreivedCb) => {
      await dropyController.retrieveDropy(dropyId, socket.user);
      retreivedCb();
      io.emit('all_dropies_around', await findAll(socket.user));
    });
  });
}
