// This utility acts as a proxy to the globally initialized Prisma client
// In Cloudflare Workers, the client must be initialized inside the fetch handler
// In local development, it will fallback to a standard initialization if globalThis.prisma isn't set.

module.exports = new Proxy({}, {
    get: (target, prop) => {
        if (globalThis.prisma) {
            return globalThis.prisma[prop];
        }

        // Fallback for local development/scripts if not already initialized
        if (!target.instance) {
            const { PrismaClient } = require('@prisma/client');
            target.instance = new PrismaClient();
        }
        return target.instance[prop];
    }
});
