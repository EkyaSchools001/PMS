import { verifyToken } from '../utils/jwt.js';
import prisma from '../utils/prisma.js';

export const authenticate = async (c, next) => {
    const authHeader = c.req.header('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return c.json({ message: 'Unauthorized: No token provided' }, 401);
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = verifyToken(token);
        const user = await prisma.user.findUnique({ where: { id: decoded.userId } });

        if (!user) {
            return c.json({ message: 'Unauthorized: User not found' }, 401);
        }

        c.set('user', user);
        await next();
    } catch (error) {
        return c.json({ message: 'Unauthorized: Invalid token' }, 401);
    }
};

export const authorize = (roles = []) => {
    return async (c, next) => {
        const user = c.get('user');
        if (!roles.includes(user.role)) {
            return c.json({ message: 'Forbidden: Insufficient permissions' }, 403);
        }
        await next();
    };
};
