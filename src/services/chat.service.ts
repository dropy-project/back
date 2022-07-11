import { ChatMessage, UserConversation } from '@/interfaces/chat.interface';
import client from '@/prisma/client';
import { User } from '@prisma/client';
import { sendPushNotification } from '../notification';

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
export async function getMessages(conversationId: number, offset: number, limit: number): Promise<ChatMessage[]> {
  const skip = offset * limit;
  const chatMessages = await client.chatMessage.findMany({
    where: {
      conversationId: conversationId,
    },
    orderBy: {
      date: 'desc',
    },
    include: { sender: true, dropy: true },
    skip: skip,
    take: limit,
  });

  return chatMessages.reverse().map(message => ({
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
    where: { id: conversationId },
    include: { users: true, messages: true },
  });

  const disconnectedUsers = conversation.users.filter(user => {
    return !connectedUsers.some(connectedUser => connectedUser.id === user.id);
  });

  sendPushNotification({
    users: disconnectedUsers,
    title: user.displayName,
    body: content,
    sound: 'message_sound.mp3',
    payload: {
      id: conversation.id,
      user: {
        userId: user.id,
        displayName: user.displayName,
      },
    } as UserConversation,
  });

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
