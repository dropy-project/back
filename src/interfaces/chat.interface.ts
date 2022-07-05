export interface UserConversation {
  id: number;
  user: {
    displayName: string;
    userId: number;
  };
  lastMessagePreview: string | null;
  lastMessageDate: Date | null;
  isOnline: boolean;
  isRead: boolean;
}

export interface ChatMessage {
  id: number;
  date: Date;
  content: string;
  read: boolean;
  sender: {
    displayName: string;
    id: number;
  };
}
