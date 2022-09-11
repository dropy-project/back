import client from '@/client';
import { HttpException } from '@exceptions/HttpException';
import { Dropy, MediaType, User } from '@prisma/client';
import { deleteContent } from '@/utils/content.utils';
import { DropyWithUsers } from '@/interfaces/dropy.interface';

export async function API(): Promise<Object> {
  const users = await client.user.findMany();
  const dropies = await client.dropy.findMany();
  let activeUsers = 0;

  //find the number of users that were active in the last 24 hours
  users.forEach(user => {
    if (user.lastLoginDate > new Date(Date.now() - 24 * 60 * 60 * 1000)) {
      activeUsers++;
    }
  });

  return {
    total_users: users.length,
    total_users_last_24h: activeUsers,
    total_dropies: dropies.length,
  };
}
