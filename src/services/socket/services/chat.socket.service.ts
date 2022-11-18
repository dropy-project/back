import { ChatConversation, User } from '@prisma/client';
import client from '@/client';
import { UserMessage, UserConversation } from '@interfaces/chat.interface';
import { sendPushNotification } from '@/notification';
import { decryptMessage } from '@/utils/encrypt';
import { SimplifiedDropy } from '@/interfaces/dropy.interface';
import { incrementUserBadgeNotification } from './user.socket.service';
import { Console } from 'console';

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
    content: message.content ?? {
      id: message.dropy.id,
      latitude: message.dropy.latitude,
      longitude: message.dropy.longitude,
      mediaUrl: message.dropy.mediaUrl,
      retrieveDate: message.dropy.retrieveDate,
      mediaType: message.dropy.mediaType,
      creationDate: message.dropy.creationDate,
      emitter: { id: message.dropy.emitterId },
      retriever: { id: message.dropy.retrieverId },
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
  const decryptMessageContent = decryptMessage(content);
  console.log('decryptMessageContent', decryptMessageContent);
  for (const disconnectedUser of notBlockedDisconnectedUsers) {
    incrementUserBadgeNotification(disconnectedUser)
      .then(disconnectedUser =>
        sendPushNotification({
          user: disconnectedUser,
          title: user.displayName,
          body: decryptMessageContent,
          sound: 'message_sound.mp3',
          payload: conversation.id,
        }),
      )
      .catch(error => {
        console.error('SERVER SIDE ERROR >> Notifs with badges', error);
      });
  }

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
    userConversations.push(await chatConversationToUserConversation(user, conv));
  }

  return userConversations;
}

export async function getUserConversationWithUsers(chatConversation: ChatConversation): Promise<ChatConversation & { users: User[] }> {
  const chatConversationWithUsers = await client.chatConversation.findUnique({
    where: {
      id: chatConversation.id,
    },
    include: { users: true },
  });

  return chatConversationWithUsers;
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

  let content: SimplifiedDropy | string | null = lastMessage.content;
  if (content == null && lastMessage.dropy != null) {
    content = {
      id: lastMessage.dropy.id,
      latitude: lastMessage.dropy.latitude,
      longitude: lastMessage.dropy.longitude,
      mediaUrl: lastMessage.dropy.mediaUrl,
      retrieveDate: lastMessage.dropy.retrieveDate,
      mediaType: lastMessage.dropy.mediaType,
      creationDate: lastMessage.dropy.creationDate,
      emitter: { id: lastMessage.dropy.emitterId },
      retriever: { id: lastMessage.dropy.retrieverId },
    };
  }

  return {
    content,
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
    where: { conversationId: conversationId },
    include: { sender: true, dropy: true },
  });

  return chatMessages.map(message => ({
    content: message.content ?? {
      id: message.dropy.id,
      latitude: message.dropy.latitude,
      longitude: message.dropy.longitude,
      mediaUrl: message.dropy.mediaUrl,
      retrieveDate: message.dropy.retrieveDate,
      mediaType: message.dropy.mediaType,
      creationDate: message.dropy.creationDate,
      emitter: { id: message.dropy.emitterId },
      retriever: { id: message.dropy.retrieverId },
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

export async function chatConversationToUserConversation(
  user: User,
  chatConversations: ChatConversation & { users: User[] },
  lastMessage?: UserMessage,
): Promise<UserConversation> {
  const otherUser = chatConversations.users.find((u: User) => u.id !== user.id);

  const _lastMessage = lastMessage ?? (await getLastMessage(chatConversations.id));
  const lastMessageContent: string | SimplifiedDropy | null = _lastMessage.content;
  const lastMessagePreview: string | null = typeof lastMessageContent === 'string' ? lastMessageContent : null;

  return {
    id: chatConversations.id,
    isOnline: otherUser.isOnline,
    unreadMessagesCount: await getConversationUnreadMessageCount(chatConversations.id, otherUser.id),
    lastMessagePreview,
    lastMessageDate: _lastMessage?.date ?? null,
    user: {
      id: otherUser.id,
      username: otherUser.username,
      displayName: otherUser.displayName,
      avatarUrl: otherUser.avatarUrl,
    },
  };
}
