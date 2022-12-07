import { chatNamespace } from '../socket';

import { AuthenticatedSocket } from '@interfaces/auth.interface';

import { throwIfNotFunction, throwIfNotNumber, throwIfNotString } from '@utils/controller.utils';
import { Logger } from '@utils/logs.utils';
import { handleSocketRawError, getUsersSockets } from '@utils/socket.utils';

import * as chatSocket from '../emitters/chat.socket.emitters';

export function startSocket() {
  chatNamespace.on('connection', async (socket: AuthenticatedSocket) => {
    try {
      chatSocket.sendConnectionStatus(socket, true);
    } catch (error) {
      handleSocketRawError(null, error);
    }
    const logger = new Logger('Chat Socket', socket.user);
    logger.log('Connected');

    socket.on('join_conversation', async (data, callback) => {
      try {
        throwIfNotNumber(data);
        throwIfNotFunction(callback);

        await chatSocket.joinConversation(socket, data, callback);
        logger.log('Join conversation');
      } catch (error) {
        handleSocketRawError(callback, error);
      }
    });

    socket.on('create_conversation', async (data, callback) => {
      try {
        const { dropyId } = data;
        throwIfNotFunction(callback);

        await chatSocket.createConversation(socket, dropyId, callback);
      } catch (error) {
        handleSocketRawError(callback, error);
      }
    });

    socket.on('list_messages', async (data, callback) => {
      try {
        const { conversationId, offset, limit } = data;
        throwIfNotNumber(conversationId, offset, limit);
        throwIfNotFunction(callback);

        await chatSocket.listMessages(conversationId, offset, limit, callback);
        logger.log('List messages');
      } catch (error) {
        handleSocketRawError(callback, error);
      }
    });

    socket.on('leave_conversation', async (data, callback) => {
      try {
        throwIfNotNumber(data);
        throwIfNotFunction(callback);

        await chatSocket.leaveConversation(socket, data, callback);
        logger.log('Leave conversation');
      } catch (error) {
        handleSocketRawError(callback, error);
      }
    });

    socket.on('message_sent', async (data, callback) => {
      try {
        const { content, conversationId } = data;
        throwIfNotString(content);
        throwIfNotNumber(conversationId);
        throwIfNotFunction(callback);

        await chatSocket.createMessage(socket, content, conversationId, callback);
        logger.log('Message sent');
      } catch (error) {
        handleSocketRawError(callback, error);
      }
    });

    socket.on('list_conversations', async callback => {
      try {
        throwIfNotFunction(callback);

        await chatSocket.listConversations(socket, callback);
        logger.log('List conversations');
      } catch (error) {
        handleSocketRawError(callback, error);
      }
    });

    socket.on('close_conversation', async (data, callback) => {
      try {
        throwIfNotNumber(data);
        throwIfNotFunction(callback);

        await chatSocket.closeConversation(data, callback);
        logger.log('Close conversation');
      } catch (error) {
        handleSocketRawError(callback, error);
      }
    });

    socket.on('disconnecting', async () => {
      try {
        await chatSocket.sendConnectionStatus(socket, false);
        logger.log('Disconnected');
      } catch (error) {
        console.error('Disconnection handling error', error);
      }
    });
  });
}
