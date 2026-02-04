let cachedApp;

export default {
    async fetch(request, env, ctx) {
        try {
            if (!cachedApp) {
                // Lazy load everything to avoid startup memory limits
                const { default: app } = await import('./src/app.js');
                const { getPrisma } = await import('./src/db/prisma-d1.js');

                globalThis.prisma = getPrisma(env.DB);
                cachedApp = app;
            }

            const { handleAsNodeRequest } = await import('cloudflare:node');

            // Store env in app for access in routes/controllers
            cachedApp.set('env', env);

            // Use Cloudflare's native Node.js request handler
            // Passing the 'app' directly is the standard way for Express on Workers
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
