import { ChatConversation, User } from '@prisma/client';
import client from '@/client';
import { UserMessage, UserConversation } from '@interfaces/chat.interface';
import { sendPushNotification } from '@/notification';
import { decryptMessage } from '@/utils/encrypt';
import { SimplifiedDropy } from '@/interfaces/dropy.interface';

export async function getConversationByIdWithUsers(conversationId: number): Promise<ChatConversation & { users: User[] }> {
  return await client.chatConversation.findFirst({
    where: { id: conversationId },
    include: { users: true },
  });
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
      avatarUrl: message.sender.avatarUrl,
    },
  }));
}

export async function addMessage(user: User, connectedUsers: User[], content: string, conversationId: number): Promise<UserMessage> {
  const userWithBlockedUsers = await client.user.findUnique({
    where: { id: user.id },
    include: { blockedUsers: true },
  });

  const conversation = await client.chatConversation.findFirst({
    where: { id: conversationId },
    include: { users: true, messages: true },
  });

  const disconnectedUsers = conversation.users.filter(user => {
    return !connectedUsers.some(connectedUser => connectedUser.id === user.id);
  });

  const blockedUsersIds = userWithBlockedUsers.blockedUsers.map(user => user.id);
  const notBlockedDisconnectedUsers = disconnectedUsers.filter(disconnectedUser => {
    return blockedUsersIds.every(id => id !== disconnectedUser.id);
  });

  const message = await client.chatMessage.create({
    data: {
      conversationId: conversationId,
      senderId: user.id,
      content: content,
      read: connectedUsers.some(connectedUser => connectedUser.id !== user.id),
    },
  });

  sendPushNotification({
    users: notBlockedDisconnectedUsers,
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
      avatarUrl: user.avatarUrl,
    },
  };
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

    const lastMessagePreview = (lastMessage?.content as SimplifiedDropy).id != undefined ? null : (lastMessage?.content as string);

    userConversations.push({
      id: conv.id,
      isOnline: otherUser.isOnline,
      unreadMessagesCount: await getConversationUnreadMessageCount(conv.id, otherUser.id),
      lastMessagePreview,
      lastMessageDate: lastMessage?.date ?? null,
      user: {
        id: otherUser.id,
        username: otherUser.username,
        displayName: otherUser.displayName,
        avatarUrl: otherUser.avatarUrl,
      },
    });
  }

  return userConversations;
}

export async function getConversationUnreadMessageCount(conversationId: number, userId: number): Promise<number> {
  return await client.chatMessage.count({
    where: {
      conversationId: conversationId,
      senderId: userId,
      read: false,
    },
  });
}

export async function getLastMessage(conversationId: number): Promise<UserMessage> {
  const lastMessage = await client.chatMessage.findFirst({
    where: { conversationId },
    orderBy: { date: 'desc' },
    include: { sender: true, dropy: true },
  });

  return {
    content: lastMessage.content ?? lastMessage.dropy,
    date: lastMessage.date,
    id: lastMessage.id,
    read: lastMessage.read,
    sender: {
      id: lastMessage.sender.id,
      username: lastMessage.sender.username,
      displayName: lastMessage.sender.displayName,
      avatarUrl: lastMessage.sender.avatarUrl,
    },
  };
}

export async function closeConversation(conversationId: number): Promise<void> {
  await client.chatConversation.update({
    where: { id: conversationId },
    data: { closed: true },
  });
}

export async function getAllMessages(conversationId: number): Promise<UserMessage[]> {
  const chatMessages = await client.chatMessage.findMany({
    where: {
      conversationId: conversationId,
    },
    include: { sender: true, dropy: true },
  });

  return chatMessages.map(message => ({
    content: message.content ?? {
      id: message.dropy.id,
      mediaUrl: message.dropy.mediaUrl,
      mediaType: message.dropy.mediaType,
      creationDate: message.dropy.creationDate,
      latitude: message.dropy.latitude,
      longitude: message.dropy.longitude,
      retrieveDate: message.dropy.retrieveDate,
    },
    date: message.date,
    read: message.read,
    id: message.id,
    sender: {
      username: message.sender.username,
      displayName: message.sender.displayName,
      id: message.sender.id,
      avatarUrl: message.sender.avatarUrl,
    },
  }));
}

export async function markConversationAsRead(conversationId: number, userId: number): Promise<void> {
  await client.chatMessage.updateMany({
    where: {
      senderId: userId,
      conversationId,
    },
    data: { read: true },
  });
}
