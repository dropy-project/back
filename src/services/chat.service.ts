import { UserMessage, UserConversation } from '@/interfaces/chat.interface';
import client from '@/prisma/client';
import { decryptMessage } from '@/utils/encrypt';
import { ChatConversation, ChatMessage, User } from '@prisma/client';
import { sendPushNotification } from '../notification';

export async function getAllMessages(conversationId: number): Promise<UserMessage[]> {
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
      username: message.sender.username,
      displayName: message.sender.displayName,
      id: message.sender.id,
    },
  }));
}
export async function getMessages(conversationId: number, offset: number, limit: number): Promise<UserMessage[]> {
  const skip = offset * limit;
  const chatMessages = await client.chatMessage.findMany({
    where: {
      conversationId: conversationId,
      OR: [
        {
          AND: [{ NOT: { dropyId: null } }, { NOT: { content: null } }],
        },
        {
          AND: [{ dropyId: null }, { NOT: { content: null } }],
        },
        {
          AND: [{ NOT: { dropyId: null } }, { content: null }],
        },
      ],
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
      username: message.sender.username,
      displayName: message.sender.displayName,
      id: message.sender.id,
    },
  }));
}

export async function closeConversation(conversationId: number): Promise<void> {
  await client.chatConversation.update({
    where: { id: conversationId },
    data: { closed: true },
  });
}

export async function addMessage(user: User, connectedUsers: User[], content: string, conversationId: number): Promise<UserMessage> {
  const userWithBlockedUsers = await client.user.findUnique({
    where: { id: user.id },
    include: { blockedUsers: true },
  });

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

  const filteredDisconnectedUsers = disconnectedUsers.filter(userToFilter => {
    return userWithBlockedUsers.blockedUsers.some(blockedUser => blockedUser.id === userToFilter.id);
  });

  sendPushNotification({
    users: filteredDisconnectedUsers,
    title: user.displayName,
    body: decryptMessage(content),
    sound: 'message_sound.mp3',
    payload: {
      id: conversation.id,
      user: {
        id: user.id,
        username: user.username,
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
      username: user.username,
    },
  };
}

export async function getConversationByIdWithUsers(conversationId: number): Promise<ChatConversation & { users: User[] }> {
  return await client.chatConversation.findFirst({
    where: { id: conversationId },
    include: { users: true },
  });
}

export async function getAllUserConversations(user: User): Promise<UserConversation[]> {
  const chatConversations = await client.chatConversation.findMany({
    where: {
      users: { some: { id: user.id }, every: { isBanned: false } },
      closed: false,
    },
    include: { users: true },
  });

  const userConversations: UserConversation[] = [];
  for (const conv of chatConversations) {
    const otherUser = conv.users.find((u: User) => u.id !== user.id);
    const lastMessage = await getLastMessage(conv.id);

    userConversations.push({
      id: conv.id,
      isOnline: otherUser.isOnline,
      isRead: lastMessage?.read ?? false,
      lastMessagePreview: lastMessage?.content ?? null,
      lastMessageDate: lastMessage?.date ?? null,
      user: {
        id: otherUser.id,
        username: otherUser.username,
        displayName: otherUser.displayName,
      },
    });
  }

  return userConversations;
}

export function getLastMessage(conversationId: number): Promise<ChatMessage> {
  const lastMessage = client.chatMessage.findFirst({
    where: { conversationId },
    orderBy: { date: 'desc' },
    include: { sender: true, dropy: true },
  });
  return lastMessage;
}

export async function getAllChatConversations(user: User): Promise<ChatConversation[]> {
  const conversations = await client.chatConversation.findMany({
    where: {
      users: { some: { id: user.id } },
      closed: false,
    },
    include: { users: true },
  });
  return conversations;
}
