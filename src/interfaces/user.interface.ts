import { User } from '@prisma/client';

export type Profile = Pick<
  User,
  | 'id'
  | 'username'
  | 'displayName'
  | 'email'
  | 'registerDate'
  | 'isOnline'
  | 'about'
  | 'avatarUrl'
  | 'pronouns'
  | 'isAdmin'
  | 'isDeveloper'
  | 'isAmbassador'
  | 'isBanned'
  | 'isPremium'
  | 'energy'
> & {
  emittedDropiesCount: number;
  retrievedDropiesCount: number;
};

export type UpdatableProfileInfos = Pick<User, 'about' | 'pronouns' | 'displayName'>;

export type SimplifiedUser = Pick<User, 'id' | 'username' | 'displayName' | 'avatarUrl'>;
