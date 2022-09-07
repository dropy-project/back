import { Dropy } from '@prisma/client';
import { SimplifiedUser } from './user.interface';

export type DropyAround = Pick<Dropy, 'id' | 'creationDate' | 'latitude' | 'longitude'>;

export type SimplifiedDropy = Pick<Dropy, 'id' | 'mediaUrl' | 'mediaType' | 'latitude' | 'longitude' | 'creationDate' | 'retrieveDate'> & {
  emitter: { id: number };
  retriever: { id: number };
};

export type DropyWithUsers = SimplifiedDropy & {
  emitter: SimplifiedUser;
  retriever?: SimplifiedUser;
  conversationId: number;
};
