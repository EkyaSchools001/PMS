import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { authRoutes } from './routes/hono/authRoutes.js';
// Add other routes as they are migrated

const app = new Hono().basePath('/api/v1');

// Middleware
app.use('*', logger());
app.use('*', cors({
    origin: '*', // Adjust for production
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    exposeHeaders: ['Content-Length'],
    maxAge: 600,
    credentials: true,
}));

// Routes
app.route('/auth', authRoutes);

// Error handling
app.onError((err, c) => {
    console.error(`${err}`);
    return c.json({ message: 'Server Error', error: err.message }, 500);
});

export default app;
