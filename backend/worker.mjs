import { handleAsNodeRequest } from 'cloudflare:node';

let cachedApp;

export default {
    async fetch(request, env, ctx) {
        try {
            if (!cachedApp) {
                // Lazy load the application logic to bypass startup memory limits
                // We use dynamic import for the CJS modules
                const [{ default: app }, { getPrisma }] = await Promise.all([
                    import('./src/app.js'),
                    import('./src/db/prisma-d1.js')
                ]);

                // Initialize database adapter
                globalThis.prisma = getPrisma(env.DB);
                cachedApp = app;
            }

            // Store env in app for access in routes/controllers
            cachedApp.set('env', env);
            process.env.PORT = '8787';

            // Pass the Express app function directly to handleAsNodeRequest
            // This avoids calling http.createServer in the worker and bypasses unenv conflicts
            return await handleAsNodeRequest(cachedApp, request, env, ctx);
        } catch (error) {
            console.error('Worker Error:', error);
            const status = error.message.includes('port') ? 503 : 500;
            return new Response(`Worker Error: ${error.message}\nStack: ${error.stack}`, {
                status,
                headers: { 'Content-Type': 'text/plain' }
            });
        }
    }
};
