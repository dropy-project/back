import { Dropy } from '@prisma/client';

export type DropyAround = Pick<Dropy, 'id' | 'creationDate' | 'latitude' | 'longitude'>;
