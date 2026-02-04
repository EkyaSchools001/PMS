import { handleAsNodeRequest } from 'cloudflare:node';
import { createServer } from 'node:http';

let server;

export default {
    async fetch(request, env, ctx) {
        try {
            if (!server) {
                // Create a minimal Node.js server to test the bridge
                server = createServer((req, res) => {
                    res.writeHead(200, { 'Content-Type': 'text/plain' });
                    res.end('Bridge is working! 🦾 - ' + new Date().toISOString());
                });

                // Try listening on a standard port
                server.listen(8080);
            }

            return await handleAsNodeRequest(server, request, env, ctx);
        } catch (error) {
            console.error('Bridge Error:', error);
            return new Response(`Bridge Error: ${error.message}\nStack: ${error.stack}`, {
                status: 500,
                headers: { 'Content-Type': 'text/plain' }
            });
        }
    }
};
