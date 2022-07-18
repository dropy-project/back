import { chatNamespace } from '../socket';

import { AuthenticatedSocket } from '@/interfaces/auth.interface';

import { throwIfNotNumber, throwIfNotString } from '@/utils/controller.utils';
import { Logger } from '@/utils/logs.utils';
import { createSocketError } from '@/utils/socket.utils';

import * as chatSocket from '../chat.socket';

export function startSocket() {
  chatNamespace.on('connection', async (socket: AuthenticatedSocket) => {
    const logger = new Logger('Chat Socket', socket.user);

    chatSocket.sendConnectionStatus(socket, true);
    logger.log('Connected');

    socket.on('join_conversation', (data, cb) => {
      try {
        throwIfNotNumber(data);

        chatSocket.joinConversation(socket, data, cb);
        logger.log('Join conversation');
      } catch (error) {
        cb(createSocketError(error));
      }
    });

    socket.on('list_messages', (data, cb) => {
      try {
        const { conversationId, offset, limit } = data;
        throwIfNotNumber(conversationId);
        throwIfNotNumber(offset);
        throwIfNotNumber(limit);

        chatSocket.listMessages(conversationId, offset, limit, cb);
        logger.log('List messages');
      } catch (error) {
        cb(createSocketError(error));
      }
    });

    socket.on('leave_conversation', (data, cb) => {
      try {
        throwIfNotNumber(data);

        chatSocket.leaveConversation(socket, data, cb);
        logger.log('Leave conversation');
      } catch (error) {
        cb(createSocketError(error));
      }
    });

    socket.on('message_sent', (data, cb) => {
      try {
        const { content, conversationId } = data;
        throwIfNotString(content);
        throwIfNotNumber(conversationId);

        chatSocket.createMessage(socket, content, conversationId, cb);
        logger.log('Message sent');
      } catch (error) {
        cb(createSocketError(error));
      }
    });

    socket.on('list_conversations', cb => {
      try {
        chatSocket.listConversations(socket, cb);
        logger.log('List conversations');
      } catch (error) {
        cb(createSocketError(error));
      }
    });

    socket.on('close_conversation', (data, cb) => {
      try {
        throwIfNotNumber(data);

        chatSocket.closeConversation(data, cb);
        logger.log('Close conversation');
      } catch (error) {
        cb(createSocketError(error));
      }
    });

    socket.on('disconnecting', async () => {
      try {
        chatSocket.sendConnectionStatus(socket, false);
        logger.log('Disconnected');
      } catch (error) {
        console.error('Disconnection handling error', error);
      }
    });
  });
}
