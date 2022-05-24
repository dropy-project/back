import { Dropy } from '@prisma/client';

export interface DropyAround extends Pick<Dropy, 'id' | 'creationDate' | 'latitude' | 'longitude'> {
  isUserDropy: boolean;
}
