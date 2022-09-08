import { chatNamespace } from '../socket';
import { ChatConversation, User } from '@prisma/client';

import { AuthenticatedSocket } from '@interfaces/auth.interface';
import { UserConversation, UserMessage } from '@interfaces/chat.interface';
import { SocketCallback } from '@interfaces/socket.interface';

import { getRoomConnectedUsers, getUsersSockets, handleSocketRawError } from '@utils/socket.utils';

import * as userController from '@services/api/controllers/users.controller';
import * as chatService from '@services/socket/services/chat.socket.service';

export async function joinConversation(clientSocket: AuthenticatedSocket, conversationId: number, callback: SocketCallback<UserMessage[]>) {
  await clientSocket.join(`conversation-${conversationId}`);
  const conversation = await chatService.getConversationByIdWithUsers(conversationId);

  const otherUser = conversation.users.find((u: User) => u.id !== clientSocket.user.id);

  await chatService.markConversationAsRead(conversationId, otherUser.id);

  clientSocket.emit('user_status', {
    status: 200,
    data: otherUser.isOnline,
  });

  clientSocket.broadcast.to(`conversation-${conversationId}`).emit('join_conversation', {
    status: 200,
  });

  callback({
    status: 200,
  });
}

export async function listMessages(conversationId: number, offset: number, limit: number, callback: SocketCallback<UserMessage[]>) {
  callback({
    status: 200,
    data: await chatService.getMessages(conversationId, offset, limit),
  });
}

export async function createMessage(
  clientSocket: AuthenticatedSocket,
  content: string,
  conversationId: number,
  callback: SocketCallback<{ messageId: number; messageRead: boolean }>,
) {
  const connectedUsers = await getRoomConnectedUsers(chatNamespace, `conversation-${conversationId}`);
  const message = await chatService.addMessage(clientSocket.user, connectedUsers, content, conversationId);
  const chatConversation = await chatService.getConversationByIdWithUsers(conversationId);

  clientSocket.broadcast.to(`conversation-${conversationId}`).emit('message_sent', {
    status: 200,
    data: message,
  });

  const socketsToEmit = await getUsersSockets(chatNamespace, chatConversation.users);

  socketsToEmit.forEach(socket => {
    emitConversationUpdated(socket, chatConversation, message).catch(error => {
      handleSocketRawError(null, error);
    });
  });

  callback({
    status: 200,
    data: {
      messageId: message.id,
      messageRead: message.read,
    },
  });
}

export async function leaveConversation(clientSocket: AuthenticatedSocket, conversationId: any, callback: SocketCallback<null>) {
  clientSocket.leave(`conversation-${conversationId}`);
  callback({
    status: 200,
  });
}

export async function sendConnectionStatus(clientSocket: AuthenticatedSocket, connected: boolean) {
  await userController.changeOnlineStatus(clientSocket.user, connected);
  const userConversations = await chatService.getAllChatConversations(clientSocket.user);

  userConversations.forEach(async (conversation: ChatConversation & { users: User[] }) => {
    chatNamespace.to(`conversation-${conversation.id}`).emit('user_status', {
      status: 200,
      data: connected,
    });

    const usersToEmit = await getUsersSockets(chatNamespace, conversation.users);
    usersToEmit.forEach(socket => {
      emitConversationUpdated(socket, conversation).catch(error => {
        handleSocketRawError(null, error);
      });
    });
  });
}

export async function listConversations(clientSocket: AuthenticatedSocket, callback: SocketCallback<UserConversation[]>) {
  callback({
    status: 200,
    data: await chatService.getAllUserConversations(clientSocket.user),
  });
}

export async function closeConversation(conversationId: any, callback: SocketCallback<null>) {
  await chatService.closeConversation(conversationId);

  const chatConversation = await chatService.getConversationByIdWithUsers(conversationId);
  const socketsToEmit = await getUsersSockets(chatNamespace, chatConversation.users);
  const socketsToEmitIds = socketsToEmit.map(socket => socket.id);

  chatNamespace.to(socketsToEmitIds).emit('close_conversation', {
    status: 200,
    data: { id: chatConversation.id },
  });

  callback({
    status: 200,
  });
}

const emitConversationUpdated = async (
  socket: AuthenticatedSocket,
  conversation: ChatConversation & { users: User[] },
  lastMessage?: UserMessage,
) => {
  const updatedConversation = await chatService.chatConversationToUserConversation(socket.user, conversation, lastMessage);

  chatNamespace.to(socket.id).emit('conversation_updated', {
    status: 200,
    data: updatedConversation,
  });
};
