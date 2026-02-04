let cachedApp;
let cachedServer;
let listeningPromise;

export default {
    async fetch(request, env, ctx) {
        try {
            // Lazy load the bridge and app to bypass startup memory limits
            if (!cachedApp) {
                const [{ handleAsNodeRequest }, { createServer }, { default: app }, { getPrisma }] = await Promise.all([
                    import('cloudflare:node'),
                    import('node:http'),
                    import('./src/app.js'),
                    import('./src/db/prisma-d1.js')
                ]);

                // Initialize database adapter
                globalThis.prisma = getPrisma(env.DB);

                cachedApp = app;
                cachedServer = createServer(cachedApp);

                // Ensure the server is "listening" so handleAsNodeRequest can find a port
                listeningPromise = new Promise((resolve) => {
                    cachedServer.listen(0, resolve);
                });
            }

            // Always wait for the server to be ready before processing the request
            await listeningPromise;

            const { handleAsNodeRequest } = await import('cloudflare:node');

            // Store env in app for access in routes/controllers
            cachedApp.set('env', env);
            process.env.PORT = '8787';

            // Use Cloudflare's native Node.js request handler
            return await handleAsNodeRequest(cachedServer, request, env, ctx);
        } catch (error) {
            console.error('Worker Error:', error);
            return new Response(`Worker Error: ${error.message}\nStack: ${error.stack}`, {
                status: 500,
                headers: { 'Content-Type': 'text/plain' }
            });
        }
    }
};
