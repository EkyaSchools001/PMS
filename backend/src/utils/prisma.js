// This utility acts as a proxy to the globally initialized Prisma client
// In Cloudflare Workers, the client must be initialized inside the fetch handler
// In local development, it will fallback to a standard initialization if globalThis.prisma isn't set.

import { PrismaClient } from '@prisma/client';

const prismaProxy = new Proxy({}, {
    get: (target, prop) => {
        if (globalThis.prisma) {
            return globalThis.prisma[prop];
        }

        // Fallback for local development/scripts if not already initialized
        if (!target.instance) {
            target.instance = new PrismaClient();
        }
        return target.instance[prop];
    }
});

export default prismaProxy;
