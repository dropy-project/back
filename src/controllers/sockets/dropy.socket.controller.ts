import { User } from '@prisma/client';
import { DropyAround } from '@/interfaces/dropy.interface';

import * as dropyService from '@/services/dropy.service';
import * as utils from '@/utils/controller.utils';

export async function createDropy(body, user: User): Promise<DropyAround> {
  const { latitude, longitude } = body;
  utils.throwIfNotNumber(latitude, longitude);

  return await dropyService.createDropy(user, latitude, longitude);
}

export async function findDropiesAround(): Promise<DropyAround[]> {
  const dropiesAround = await dropyService.findDropiesAround();
  return dropiesAround;
}

export async function retrieveDropy(body, user: User): Promise<Number> {
  const { dropyId } = body;
  utils.throwIfNotNumber(dropyId);

  await dropyService.retrieveDropy(user, dropyId);
  console.log(`Retriever with id ${user.id} added for dropy with id ${dropyId}`);

  return dropyId;
}
