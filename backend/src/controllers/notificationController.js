import prisma from '../utils/prisma.js';

export const getNotifications = async (c) => {
    try {
        const user = c.get('user');
        const notifications = await prisma.notification.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' }
        });
        return c.json(notifications);
    } catch (error) {
        return c.json({ message: 'Error fetching notifications', error: error.message }, 500);
    }
};

export const markAsRead = async (c) => {
    try {
        const user = c.get('user');
        const { id } = c.req.param();
        const notification = await prisma.notification.update({
            where: { id, userId: user.id },
            data: { isRead: true }
        });
        return c.json(notification);
    } catch (error) {
        return c.json({ message: 'Error updating notification', error: error.message }, 500);
    }
};

export const markAllAsRead = async (c) => {
    try {
        const user = c.get('user');
        await prisma.notification.updateMany({
            where: { userId: user.id, isRead: false },
            data: { isRead: true }
        });
        return c.json({ message: 'All notifications marked as read' });
    } catch (error) {
        return c.json({ message: 'Error updating notifications', error: error.message }, 500);
    }
};

// Helper function to create notifications (can be exported for use in other controllers)
export const createNotification = async (userId, type, title, content, link = null) => {
    try {
        return await prisma.notification.create({
            data: {
                userId,
                type,
                title,
                content,
                link
            }
        });
    } catch (error) {
        console.error('Failed to create notification:', error);
    }
};
