import app from '../../backend/src/hono-app.js';
import { getPrisma } from '../../backend/src/db/prisma-d1.js';

export async function onRequest(context) {
    try {
        const { request, env } = context;

        // DEBUG: Check environment variables
        if (!env.DB) {
            throw new Error('MISSING_ENV: D1 Database binding (DB) is missing.');
        }
        if (!env.JWT_SECRET) {
            console.warn('WARNING: JWT_SECRET is missing from env');
        }

        // Initialize Prisma with the D1 binding per request
        globalThis.prisma = getPrisma(env.DB);

        // Set environment variables for compatibility
        if (env.JWT_SECRET) globalThis.JWT_SECRET = env.JWT_SECRET;

        // Pass env to app.fetch just in case
        return await app.fetch(request, env, context);

    } catch (error) {
        console.error('API Function Error:', error);
        return new Response(JSON.stringify({
            message: 'Critical Server Error',
            error: error.message,
            stack: error.stack,
            envKeys: Object.keys(context.env || {}) // Debug: list available env keys
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
