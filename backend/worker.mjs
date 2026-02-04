import { handleAsNodeRequest } from 'cloudflare:node';

let cachedApp;

export default {
    async fetch(request, env, ctx) {
        try {
            if (!cachedApp) {
                // Lazy load everything to avoid startup memory limits
                const { default: app } = await import('./src/app.js');
                const { getPrisma } = await import('./src/db/prisma-d1.js');

                // Initialize Prisma with the D1 binding
                globalThis.prisma = getPrisma(env.DB);
                cachedApp = app;
            }

            // Sync environment variables for the app
            cachedApp.set('env', env);
            process.env.PORT = '8787'; // Satisfy internal Node.js port checks

            // Use Cloudflare's bridge to handle the Express app
            return await handleAsNodeRequest(cachedApp, request, env, ctx);
        } catch (error) {
            console.error('Worker Error:', error);
            return new Response(`Worker Error: ${error.message}\nStack: ${error.stack}`, {
                status: 500,
                headers: { 'Content-Type': 'text/plain' }
            });
        }
    }
};
