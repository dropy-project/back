import { User } from '@prisma/client';

export type Profile = Pick<User, 'id' | 'username' | 'displayName' | 'email' | 'registerDate' | 'isOnline' | 'about' | 'avatarUrl' | 'pronouns'> & {
  emittedDropiesCount: number;
  retrievedDropiesCount: number;
};

export type UpdatableProfileInfos = Pick<User, 'about' | 'pronouns' | 'displayName'>;

export const userToProfile = (user: User): Profile => {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    email: user.email,
    registerDate: user.registerDate,
    isOnline: user.isOnline,
    about: user.about,
    pronouns: user.pronouns,
    avatarUrl: user.avatarUrl,
    emittedDropiesCount: -1,
    retrievedDropiesCount: -1,
  };
};
