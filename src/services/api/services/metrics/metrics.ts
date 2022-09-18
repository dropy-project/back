import client from '@/client';
import { HttpException } from '@exceptions/HttpException';
import { Dropy, MediaType, User } from '@prisma/client';
import { deleteContent } from '@/utils/content.utils';
import { DropyWithUsers } from '@/interfaces/dropy.interface';
import { json } from 'stream/consumers';
import { NextFunction, Response } from 'express';
import { AuthenticatedRequest } from '@/interfaces/auth.interface';

export async function API(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<unknown> {
  const limitDate = new Date(new Date().getTime() - 1000 * 60 * 60 * 24);
  const users = await client.user.count();
  const dropies = await client.dropy.count();
  const activeUsers = await client.user.count({
    where: {
      lastLoginDate: {
        gt: limitDate,
      },
    },
  });
  const activeDropiesDropped = await client.dropy.count({
    where: {
      creationDate: {
        gt: limitDate,
      },
    },
  });

  const activeDropiesFound = await client.dropy.count({
    where: {
      retrieveDate: {
        gt: limitDate,
      },
    },
  });

  const activeMessages = await client.chatMessage.count({
    where: {
      date: {
        gt: limitDate,
      },
    },
  });

  const activeReports = await client.report.count({
    where: {
      date: {
        gt: limitDate,
      },
    },
  });

  const metrics = {
    total_users: users,
    total_users_last_24h: activeUsers,
    total_dropies: dropies,
    total_dropies_dropped_last_24h: activeDropiesDropped,
    total_dropies_found_last_24h: activeDropiesFound,
    total_messages_last_24h: activeMessages,
    total_reports_last_24h: activeReports,
  };

  //return metrics as a json in a http response
  return res.json(metrics).status(200);
}
