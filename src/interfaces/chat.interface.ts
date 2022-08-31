import { SimplifiedDropy } from './dropy.interface';
import { SimplifiedUser } from './user.interface';

export interface UserConversation {
  id: number;
  user: SimplifiedUser;
  lastMessagePreview: string | null;
  lastMessageDate: Date | null;
  isOnline: boolean;
  isRead: boolean;
}

export interface UserMessage {
  id: number;
  date: Date;
  content: string | SimplifiedDropy;
  read: boolean;
  sender: SimplifiedUser;
}
