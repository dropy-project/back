import { ChatMessage } from '@/interfaces/chat.interface';
import client from '@/prisma/client';
import { User } from '@prisma/client';
import { sendPushNotificationToUsers } from '../notification';

export async function getAllMessages(conversationId: number): Promise<ChatMessage[]> {
  const chatMessages = await client.chatMessage.findMany({
    where: {
      conversationId: conversationId,
    },
    include: { sender: true, dropy: true },
  });

  return chatMessages.map(message => ({
    content: message.content ?? message.dropy,
    date: message.date,
    read: message.read,
    id: message.id,
    sender: {
      displayName: message.sender.displayName,
      id: message.sender.id,
    },
  }));
}

export async function addMessage(user: User, connectedUsers: User[], content: string, conversationId: number): Promise<ChatMessage> {
  const message = await client.chatMessage.create({
    data: {
      conversationId: conversationId,
      senderId: user.id,
      content: content,
    },
  });

  const conversation = await client.chatConversation.findFirst({
    where: {
      id: conversationId,
    },
    include: { users: true },
  });

  const disconnectedUsers = conversation.users.filter(user => !connectedUsers.includes(user));

  sendPushNotificationToUsers(disconnectedUsers, content, user.displayName);

  return {
    content: message.content,
    date: message.date,
    read: message.read,
    id: message.id,
    sender: {
      displayName: user.displayName,
      id: user.id,
    },
  };
}
