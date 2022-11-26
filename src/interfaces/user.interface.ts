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

export interface NotificationsSettings {
  dropyCollected: boolean;
  dailyDropyReminder: boolean;
  newFeature: boolean;
}

export enum NotificationsSettingsBitValue {
  DROPY_COLLECTED = 2,
  DAILY_DROPY_REMINDER = 4,
  NEW_FEATURE = 8,
}
