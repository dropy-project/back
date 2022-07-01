export interface UserConversation {
  id: number;
  user: {
    username: string;
    userId: number;
  };
  lastMessagePreview: string | null;
  lastMessageDate: Date | null;
  isOnline: boolean;
  isRead: boolean;
}
