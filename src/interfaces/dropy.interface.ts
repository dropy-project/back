import { Dropy } from '@prisma/client';

export type DropyAround = Pick<Dropy, 'id' | 'creationDate' | 'latitude' | 'longitude'>;

export type SimplifiedDropy = Pick<Dropy, 'id' | 'mediaUrl' | 'mediaType' | 'latitude' | 'longitude' | 'creationDate' | 'retrieveDate'>;

export type DropyWithUsers = SimplifiedDropy & {
  emitterId: number;
  emitterDisplayName: string;
  retrieverId?: number;
  retrieverDisplayName?: string;
  conversationId: number;
};
