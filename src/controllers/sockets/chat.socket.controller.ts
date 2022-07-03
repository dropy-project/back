import { ChatMessage } from '@/interfaces/chat.interface';
import * as chatService from '@/services/chat.service';
import { throwIfNotNumber, throwIfNotString } from '@/utils/controller.utils';
import { User } from '@prisma/client';

export async function getAllMessages(conversationId: number): Promise<ChatMessage[]> {
  throwIfNotNumber(conversationId);

  const allMessages = chatService.getAllMessages(conversationId);
  return allMessages;
}

export async function addMessage(user: User, connectedUsers: User[], body): Promise<ChatMessage> {
  const { content, conversationId } = body;
  throwIfNotString(content);
  throwIfNotNumber(conversationId);

  const message = chatService.addMessage(user, connectedUsers, content, conversationId);
  return message;
}
