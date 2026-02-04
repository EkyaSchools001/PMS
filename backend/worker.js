const { handleAsNodeRequest } = require('cloudflare:node');

let cachedApp;

module.exports = {
    async fetch(request, env, ctx) {
        try {
            if (!cachedApp) {
                // Load the app and db
                const app = require('./src/app.js');
                const { getPrisma } = require('./src/db/prisma-d1.js');

                // Initialize globals
                globalThis.prisma = getPrisma(env.DB);
                cachedApp = app;
            }

            // Sync env
            cachedApp.set('env', env);
            process.env.PORT = '8787';

            // Bridge directly to the app function
            // handleAsNodeRequest will create an internal server to handle the bridge
            return handleAsNodeRequest(cachedApp, request, env, ctx);
        } catch (error) {
            console.error('Worker Error:', error);
            return new Response(`Worker Error: ${error.message}\nStack: ${error.stack}`, {
                status: 500,
                headers: { 'Content-Type': 'text/plain' }
            });
        }
    }
};
