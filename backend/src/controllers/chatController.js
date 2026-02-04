import prisma from '../utils/prisma.js';

// Create a private chat (1-on-1)
export const createPrivateChat = async (c) => {
    try {
        const { targetUserId } = await c.req.json();
        const user = c.get('user');
        const currentUserId = user.id;

        if (!targetUserId) {
            return c.json({ error: 'Target user ID is required' }, 400);
        }

        // Check if chat already exists
        const existingChat = await prisma.chat.findFirst({
            where: {
                type: 'PRIVATE',
                AND: [
                    { participants: { some: { userId: currentUserId } } },
                    { participants: { some: { userId: targetUserId } } },
                ],
            },
            include: {
                participants: {
                    include: { user: { select: { id: true, fullName: true, email: true, role: true } } }
                }
            }
        });

        if (existingChat) {
            return c.json(existingChat);
        }

        // Create new chat
        const newChat = await prisma.chat.create({
            data: {
                type: 'PRIVATE',
                participants: {
                    create: [
                        { userId: currentUserId },
                        { userId: targetUserId },
                    ],
                },
            },
            include: {
                participants: {
                    include: { user: { select: { id: true, fullName: true, email: true, role: true } } }
                }
            }
        });

        return c.json(newChat, 201);
    } catch (error) {
        console.error('Error creating private chat:', error);
        return c.json({ error: 'Internal server error' }, 500);
    }
};

// Upload file (Simplified for Cloudflare - would require R2 for real storage)
export const uploadFile = async (c) => {
    try {
        const body = await c.req.parseBody();
        const file = body['file'];

        if (!file) {
            return c.json({ error: 'No file uploaded' }, 400);
        }

        // On Cloudflare Workers, there is no disk storage.
        // For now, we return a mock URL. Real implementation should use R2.
        const fileUrl = `/api/v1/files/mock/${Date.now()}_${file.name}`;
        return c.json({ url: fileUrl, filename: file.name, mimetype: file.type });
    } catch (error) {
        console.error('Error uploading file:', error);
        return c.json({ error: 'File upload failed' }, 500);
    }
};

// Send a message
export const sendMessage = async (c) => {
    try {
        const { chatId, content, attachments } = await c.req.json();
        const user = c.get('user');
        const senderId = user.id;

        if (!chatId || (!content && !attachments)) {
            return c.json({ error: 'Chat ID and content/attachments are required' }, 400);
        }

        // Verify user is participant
        const isParticipant = await prisma.chatParticipant.findUnique({
            where: {
                chatId_userId: {
                    chatId,
                    userId: senderId,
                },
            },
        });

        if (!isParticipant) {
            return c.json({ error: 'You are not a participant of this chat' }, 403);
        }

        const message = await prisma.message.create({
            data: {
                chatId,
                senderId,
                content: content || '', // Allow empty content if there's an attachment
                attachments: attachments ? JSON.stringify(attachments) : null,
            },
            include: {
                sender: { select: { id: true, fullName: true } },
            },
        });

        // NOTE: Socket.io Emit skipped.
        // Real Cloudflare implementation would use Durable Objects or External PubSub

        return c.json(message, 201);
    } catch (error) {
        console.error('Error sending message:', error);
        return c.json({ error: 'Internal server error' }, 500);
    }
};

// Get chat history
export const getChatHistory = async (c) => {
    try {
        const { chatId } = c.req.param();
        const user = c.get('user');
        const userId = user.id;

        // Verify access
        const isParticipant = await prisma.chatParticipant.findUnique({
            where: {
                chatId_userId: {
                    chatId,
                    userId,
                },
            },
        });

        if (!isParticipant) {
            return c.json({ error: 'Access denied' }, 403);
        }

        const messages = await prisma.message.findMany({
            where: { chatId },
            orderBy: { createdAt: 'asc' },
            include: {
                sender: { select: { id: true, fullName: true } },
            },
        });

        return c.json(messages);
    } catch (error) {
        console.error('Error fetching chat history:', error);
        return c.json({ error: 'Internal server error' }, 500);
    }
};

// Get user's chats
export const getUserChats = async (c) => {
    try {
        const user = c.get('user');
        const userId = user.id;

        const chats = await prisma.chat.findMany({
            where: {
                participants: {
                    some: { userId },
                },
            },
            include: {
                participants: {
                    include: {
                        user: { select: { id: true, fullName: true, role: true } },
                    },
                },
                messages: {
                    take: 1,
                    orderBy: { createdAt: 'desc' },
                },
            },
            orderBy: { updatedAt: 'desc' },
        });

        return c.json(chats);
    } catch (error) {
        console.error('Error fetching user chats:', error);
        return c.json({ error: 'Internal server error' }, 500);
    }
};
