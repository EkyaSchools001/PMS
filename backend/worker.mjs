import { handleAsNodeRequest } from 'cloudflare:node';
import { createServer } from 'node:http';

let cachedApp;
let cachedServer;
let listeningPromise;

export default {
    async fetch(request, env, ctx) {
        try {
            if (!cachedApp) {
                // Import application logic
                const [{ default: app }, { getPrisma }] = await Promise.all([
                    import('./src/app.js'),
                    import('./src/db/prisma-d1.js')
                ]);

                // Initialize database
                globalThis.prisma = getPrisma(env.DB);

                cachedApp = app;
                // Use the statically imported createServer to avoid unenv polyfills
                cachedServer = createServer(cachedApp);

                // Ensure the server is "listening" or ready for the bridge
                listeningPromise = new Promise((resolve) => {
                    cachedServer.listen(0, resolve);
                });
            }

            // Always wait for the server to be ready before processing the request
            await listeningPromise;

            // Store env in app for access in routes/controllers
            cachedApp.set('env', env);
            process.env.PORT = '8787';

            // Pass the listening server to the bridge
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
