import app from './src/hono-app.js';
import { getPrisma } from './src/db/prisma-d1.js';

export default {
    async fetch(request, env, ctx) {
        try {
            // Initialize Prisma with the D1 binding per request
            // This is required for Cloudflare D1 to work with Prisma
            globalThis.prisma = getPrisma(env.DB);

            // Set environment variables for the Hono context if needed
            // Hono handles env via c.env, but some utilities might use process.env
            // We sync them here for compatibility
            if (env.JWT_SECRET) globalThis.JWT_SECRET = env.JWT_SECRET;

            return app.fetch(request, env, ctx);
        } catch (error) {
            console.error('Worker Error:', error);
            return new Response(`Worker Error: ${error.message}\nStack: ${error.stack}`, {
                status: 500,
                headers: { 'Content-Type': 'text/plain' }
            });
        }
    }
};
