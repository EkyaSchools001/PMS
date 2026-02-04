import { Hono } from 'hono';
import * as chatController from '../../controllers/chatController.js';
import { authenticate } from '../../middlewares/honoAuth.js';
import { validateChatAccess } from '../../middlewares/honoRbac.js';

export const chatRoutes = new Hono();

// All routes require authentication
chatRoutes.use('*', authenticate);

chatRoutes.post('/upload', validateChatAccess, chatController.uploadFile);
chatRoutes.post('/private', chatController.createPrivateChat);
chatRoutes.post('/message', validateChatAccess, chatController.sendMessage);
chatRoutes.get('/:chatId/messages', validateChatAccess, chatController.getChatHistory);
chatRoutes.get('/', chatController.getUserChats);
