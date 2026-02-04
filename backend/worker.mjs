let cachedApp;
let cachedServer;
let prisma;

export default {
    async fetch(request, env, ctx) {
        if (!cachedApp) {
            // Lazy load everything to avoid startup memory limits
            const { createServer } = await import('node:http');
            const { default: app } = await import('./src/app.js');
            const { getPrisma } = await import('./src/db/prisma-d1.js');

            prisma = getPrisma(env.DB);
            cachedApp = app;
            cachedServer = createServer(cachedApp);
        }

        const { handleAsNodeRequest } = await import('cloudflare:node');

        // Store env in app for access in routes/controllers
        cachedApp.set('env', env);

        // Use Cloudflare's native Node.js request handler
        return handleAsNodeRequest(cachedServer, request, env, ctx);
    }
};
