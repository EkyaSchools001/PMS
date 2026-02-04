import { Hono } from 'hono';
import * as timeLogController from '../../controllers/timeLogController.js';
import { authenticate } from '../../middlewares/honoAuth.js';

export const timeLogRoutes = new Hono();

// All routes require authentication
timeLogRoutes.use('*', authenticate);

timeLogRoutes.post('/', timeLogController.createTimeLog);
timeLogRoutes.get('/', timeLogController.getTimeLogs);
timeLogRoutes.get('/stats', timeLogController.getTimeStats);
