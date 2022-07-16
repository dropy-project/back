import { ChatMessage, UserConversation } from '@/interfaces/chat.interface';
import * as chatService from '@/services/chat.service';
import { throwIfNotNumber, throwIfNotString } from '@/utils/controller.utils';
import { ChatConversation, User } from '@prisma/client';

export async function getAllMessages(conversationId: number): Promise<ChatMessage[]> {
  throwIfNotNumber(conversationId);

  const allMessages = chatService.getAllMessages(conversationId);
  return allMessages;
}

export async function closeConversation(conversationId: number): Promise<void> {
  throwIfNotNumber(conversationId);

  return await chatService.closeConversation(conversationId);
}

export async function getMessages(body: { conversationId: number; offset: number; limit: number }): Promise<ChatMessage[]> {
  const { conversationId, offset, limit } = body;
  throwIfNotNumber(conversationId);
  throwIfNotNumber(offset);
  throwIfNotNumber(limit);

  const messages = await chatService.getMessages(conversationId, offset, limit);
  return messages;
}

export async function addMessage(user: User, connectedUsers: User[], body: { content: string; conversationId: number }): Promise<ChatMessage> {
  const { content, conversationId } = body;
  throwIfNotString(content);
  throwIfNotNumber(conversationId);

  const message = chatService.addMessage(user, connectedUsers, content, conversationId);
  return message;
}

export async function getConversationByIdWithUsers(conversationId: number): Promise<ChatConversation & { users: User[] }> {
  throwIfNotNumber(conversationId);

  return chatService.getConversationByIdWithUsers(conversationId);
}

export async function getAllUserConversations(user: User): Promise<UserConversation[]> {
  return await chatService.getAllUserConversations(user);
}
