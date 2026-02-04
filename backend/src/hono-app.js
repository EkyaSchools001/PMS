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

const app = new Hono();

// Root health check
app.get('/', (c) => {
    return c.json({
        status: 'ok',
        message: 'PMS API is running on Cloudflare Workers',
        version: '2.0.0',
        endpoints: {
            api: '/api/v1',
            health: '/health'
        },
        timestamp: new Date().toISOString()
    });
});

app.get('/health', (c) => {
    return c.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// API routes with /api/v1 prefix
const apiApp = new Hono();

// Middleware
apiApp.use('*', logger());
apiApp.use('*', cors({
    origin: '*', // Adjust for production
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowHeaders: ['Content-Type', 'Authorization'],
    exposeHeaders: ['Content-Length'],
    maxAge: 600,
    credentials: true,
}));

// Routes
apiApp.route('/auth', authRoutes);
apiApp.route('/projects', projectRoutes);
apiApp.route('/tasks', taskRoutes);
apiApp.route('/users', userRoutes);
apiApp.route('/chats', chatRoutes);
apiApp.route('/notifications', notificationRoutes);
apiApp.route('/meetings', meetingRoutes);
apiApp.route('/rooms', roomRoutes);
apiApp.route('/tickets', ticketRoutes);
apiApp.route('/timelogs', timeLogRoutes);
apiApp.route('/calendar', calendarRoutes);
apiApp.route('/calendar/auth', calendarAuthRoutes);

// Mount API routes
app.route('/api/v1', apiApp);

// Error handling
app.onError((err, c) => {
    console.error(`${err}`);
    return c.json({ message: 'Server Error', error: err.message }, 500);
});

export default app;
