import { handleAsNodeRequest } from 'cloudflare:node';

let cachedApp;

export default {
    async fetch(request, env, ctx) {
        try {
            if (!cachedApp) {
                const { default: app } = await import('./src/app.js');
                const { getPrisma } = await import('./src/db/prisma-d1.js');
                globalThis.prisma = getPrisma(env.DB);
                cachedApp = app;
            }

            // Explicitly set port env for Express
            process.env.PORT = '80';

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
