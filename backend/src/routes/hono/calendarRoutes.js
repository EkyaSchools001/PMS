import { Hono } from 'hono';
import * as calendarController from '../../controllers/calendarController.js';
import { authenticate } from '../../middlewares/honoAuth.js';

export const calendarRoutes = new Hono();

// All routes require authentication
calendarRoutes.use('*', authenticate);

calendarRoutes.get('/events', calendarController.getCalendarEvents);
calendarRoutes.post('/views', calendarController.saveCalendarView);
