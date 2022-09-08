import { SimplifiedDropy } from './dropy.interface';
import { SimplifiedUser } from './user.interface';

export interface UserConversation {
  id: number;
  user: SimplifiedUser;
  lastMessagePreview: string | null;
  lastMessageDate: Date | null;
  isOnline: boolean;
  unreadMessagesCount: number;
}

export interface UserMessage {
  id: number;
  date: Date;
  content: string | SimplifiedDropy | null;
  read: boolean;
  sender: SimplifiedUser;
}
