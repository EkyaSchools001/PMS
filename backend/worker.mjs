import { createServer } from 'node:http';
import { handleAsNodeRequest } from 'cloudflare:node';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const app = require('./src/app');
const { getPrisma } = require('./src/db/prisma-d1');

let prisma;
const server = createServer(app);

export default {
    async fetch(request, env, ctx) {
        if (!prisma) {
            prisma = getPrisma(env.DB);
        }
        // Store env in app for access in routes/controllers
        app.set('env', env);

        // Use Cloudflare's native Node.js request handler
        return handleAsNodeRequest(server, request, env, ctx);
    }
};
