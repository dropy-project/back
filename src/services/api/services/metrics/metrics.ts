import client from '@/client';
import { HttpException } from '@exceptions/HttpException';
import { Dropy, MediaType, User } from '@prisma/client';
import { deleteContent } from '@/utils/content.utils';
import { DropyWithUsers } from '@/interfaces/dropy.interface';
import { json } from 'stream/consumers';
import { NextFunction, Response } from 'express';
import { AuthenticatedRequest } from '@/interfaces/auth.interface';

export async function API(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
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

  res.set('Content-Type', 'text/plain');
  res.send(
    `# HELP dropy_users_total Total number of users
# TYPE dropy_users_total counter
users_total ${users}
active_users_total ${activeUsers}
# HELP dropy_dropies_total Total number of dropies
# TYPE dropy_dropies_total counter
dropies_total ${dropies}
active_dropies_dropped_total ${activeDropiesDropped}
active_dropies_found_total ${activeDropiesFound}
# HELP dropy_messages_total Total number of messages
# TYPE dropy_messages_total counter
messages_total ${activeMessages}
# HELP dropy_reports_total Total number of reports
# TYPE dropy_reports_total counter
reports_total ${activeReports}
`,
  );
}
