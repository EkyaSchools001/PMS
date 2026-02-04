const http = require('http');
const { Server } = require('socket.io');
const app = require('./src/app');
const { getPrisma } = require('./src/db/prisma-d1');

const PORT = process.env.PORT || 5000;
let prisma;

async function main(d1Binding) {
    try {
        prisma = getPrisma(d1Binding);
        if (!d1Binding) {
            await prisma.$connect();
            console.log('✅ Connected to Local Database');
        } else {
            console.log('✅ Using Cloudflare D1 Database');
        }

        const server = http.createServer(app);

        // Initialize Socket.IO
        const io = new Server(server, {
            cors: {
                origin: "*", // Allow all origins for now (adjust for production)
                methods: ["GET", "POST"]
            }
        });

        // Store io instance in app for use in controllers
        app.set('io', io);

        io.on('connection', (socket) => {
            console.log('🔌 New client connected:', socket.id);

            socket.on('join_chat', (chatId) => {
                socket.join(chatId);
                console.log(`User ${socket.id} joined chat: ${chatId}`);
            });

            socket.on('disconnect', () => {
                console.log('❌ Client disconnected:', socket.id);
            });

            // --- WebRTC Signaling ---
            socket.on('call_user', (data) => {
                // data: { chatId, signalData, from, name }
                socket.to(data.chatId).emit('call_user', {
                    signal: data.signalData,
                    from: data.from,
                    name: data.name
                });
            });

            socket.on('answer_call', (data) => {
                // data: { to, signal }
                io.to(data.to).emit('call_accepted', data.signal);
            });

            socket.on('ice_candidate', (data) => {
                // data: { to, candidate }
                io.to(data.to).emit('ice_candidate', { candidate: data.candidate });
            });

            socket.on('end_call', (data) => {
                // data: { to }
                io.to(data.to).emit('call_ended');
            });
        });

        const { checkTicketReminders } = require('./src/controllers/ticketController');

        server.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);

            // Start ticket reminder checker (runs every 15 minutes)
            setInterval(() => {
                console.log('⏰ Running ticket reminder check...');
                checkTicketReminders();
            }, 15 * 60 * 1000);
        });

    } catch (error) {
        console.error('❌ Database connection failed:', error);
        process.exit(1);
    }
}

// Export for Cloudflare Workers
module.exports = {
    async fetch(request, env, ctx) {
        if (!prisma) {
            await main(env.DB);
        }
        // Store env in app for access in routes/controllers
        app.set('env', env);

        // Use a simple fetch handler for Express on Workers (requires nodejs_compat)
        // Note: For full Express support on Workers, consider using @codegen-ie/serverless-express or similar
        return app.fetch(request, env, ctx);
    }
};

// Also support direct node execution
if (require.main === module) {
    main();
}
