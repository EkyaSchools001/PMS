import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const app = require('./src/app');
const { getPrisma } = require('./src/db/prisma-d1');
import serverlessExpress from '@codegen-ie/serverless-express';

let prisma;
let serverlessHandler;

export default {
    async fetch(request, env, ctx) {
        if (!prisma) {
            prisma = getPrisma(env.DB);
        }
        // Store env in app for access in routes/controllers
        app.set('env', env);

        if (!serverlessHandler) {
            serverlessHandler = serverlessExpress({ app });
        }

        return serverlessHandler.fetch(request, env, ctx);
    }
};
