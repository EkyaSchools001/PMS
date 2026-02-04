import app from '../backend/src/hono-app.js';
import { getPrisma } from '../backend/src/db/prisma-d1.js';

export async function onRequest(context) {
    try {
        const { request, env } = context;

        // Initialize Prisma with the D1 binding per request
        globalThis.prisma = getPrisma(env.DB);

        // Set environment variables for compatibility
        if (env.JWT_SECRET) globalThis.JWT_SECRET = env.JWT_SECRET;

        return app.fetch(request, env, context);
    } catch (error) {
        console.error('Pages Function Error:', error);
        return new Response(`Server Error: ${error.message}\nStack: ${error.stack}`, {
            status: 500,
            headers: { 'Content-Type': 'text/plain' }
        });
    }
}
