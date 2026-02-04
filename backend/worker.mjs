import { handleAsNodeRequest } from 'cloudflare:node';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

// Pre-load common dependencies to speed up subsequent loads
const app = require('./src/app.js');
const { getPrisma } = require('./src/db/prisma-d1.js');

// Pre-initialize the server at the top level
// This ensures that the server is "ready" with a port metadata BEFORE the first request
const server = createServer(app);
server.listen(0);

export default {
    async fetch(request, env, ctx) {
        try {
            // Re-bind environment-specific objects per request
            globalThis.prisma = getPrisma(env.DB);
            app.set('env', env);

            // bridge the request to the listening Node.js server
            return await handleAsNodeRequest(server, request, env, ctx);
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
