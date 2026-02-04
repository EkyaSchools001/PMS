import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { authRoutes } from './routes/hono/authRoutes.js';
import { projectRoutes } from './routes/hono/projectRoutes.js';
import { taskRoutes } from './routes/hono/taskRoutes.js';
import { userRoutes } from './routes/hono/userRoutes.js';
import { chatRoutes } from './routes/hono/chatRoutes.js';
import { notificationRoutes } from './routes/hono/notificationRoutes.js';
import { meetingRoutes } from './routes/hono/meetingRoutes.js';
import { roomRoutes } from './routes/hono/roomRoutes.js';
import { ticketRoutes } from './routes/hono/ticketRoutes.js';
import { timeLogRoutes } from './routes/hono/timeLogRoutes.js';
import { calendarRoutes } from './routes/hono/calendarRoutes.js';
import { calendarAuthRoutes } from './routes/hono/calendarAuthRoutes.js';

const app = new Hono().basePath('/api/v1');

// Middleware
app.use('*', logger());
app.use('*', cors({
    origin: '*', // Adjust for production
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowHeaders: ['Content-Type', 'Authorization'],
    exposeHeaders: ['Content-Length'],
    maxAge: 600,
    credentials: true,
}));

// Routes
app.route('/auth', authRoutes);
app.route('/projects', projectRoutes);
app.route('/tasks', taskRoutes);
app.route('/users', userRoutes);
app.route('/chats', chatRoutes);
app.route('/notifications', notificationRoutes);
app.route('/meetings', meetingRoutes);
app.route('/rooms', roomRoutes);
app.route('/tickets', ticketRoutes);
app.route('/timelogs', timeLogRoutes);
app.route('/calendar', calendarRoutes);
app.route('/calendar/auth', calendarAuthRoutes);

// Error handling
app.onError((err, c) => {
    console.error(`${err}`);
    return c.json({ message: 'Server Error', error: err.message }, 500);
});

export default app;
