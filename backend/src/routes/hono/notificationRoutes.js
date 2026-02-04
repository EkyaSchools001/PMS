import { Hono } from 'hono';
import * as notificationController from '../../controllers/notificationController.js';
import { authenticate } from '../../middlewares/honoAuth.js';

export const notificationRoutes = new Hono();

// All routes require authentication
notificationRoutes.use('*', authenticate);

notificationRoutes.get('/', notificationController.getNotifications);
notificationRoutes.patch('/:id/read', notificationController.markAsRead);
notificationRoutes.patch('/read-all', notificationController.markAllAsRead);
