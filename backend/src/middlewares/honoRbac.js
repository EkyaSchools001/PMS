import prisma from '../utils/prisma.js';
import { ROLES } from '../utils/policies.js';

/**
 * Higher-order middleware to check if user has the required role(s).
 */
export const authorizeRole = (requiredRoles) => {
    return async (c, next) => {
        const user = c.get('user');
        if (!user) {
            return c.json({ message: 'Authentication required' }, 401);
        }

        const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];

        if (!roles.includes(user.role)) {
            return c.json({
                message: `Access denied. Requires one of the following roles: ${roles.join(', ')}`
            }, 403);
        }

        await next();
    };
};

/**
 * Middleware to check project ownership/access.
 */
export const validateProjectAccess = async (c, next) => {
    const user = c.get('user');
    const userId = user.id;
    const role = user.role;
    const projectId = c.req.param('projectId') || c.req.param('id') || (await c.req.json().catch(() => ({}))).projectId;

    if (!projectId) {
        return c.json({ message: 'Project ID is required' }, 400);
    }

    if (role === ROLES.ADMIN) return await next();

    try {
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: {
                members: { select: { id: true } }
            }
        });

        if (!project) {
            return c.json({ message: 'Project not found' }, 404);
        }

        const isManager = project.managerId === userId;
        const isCustomer = project.customerId === userId;
        const isMember = project.members.some(m => m.id === userId);

        if (role === ROLES.MANAGER && isManager) return await next();
        if (role === ROLES.EMPLOYEE && isMember) return await next();
        if (role === ROLES.CUSTOMER && isCustomer) return await next();

        return c.json({ message: 'Access denied: You are not assigned to this project' }, 403);
    } catch (error) {
        console.error('RBAC Error:', error);
        return c.json({ message: 'Internal server error during authorization' }, 500);
    }
};

/**
 * Middleware to check task ownership/access.
 */
export const validateTaskAccess = async (c, next) => {
    const user = c.get('user');
    const userId = user.id;
    const role = user.role;
    const taskId = c.req.param('taskId') || c.req.param('id') || (await c.req.json().catch(() => ({}))).taskId;

    if (!taskId) return await next();

    if (role === ROLES.ADMIN) return await next();

    try {
        const task = await prisma.task.findUnique({
            where: { id: taskId },
            include: {
                project: true,
                assignees: { select: { id: true } }
            }
        });

        if (!task) {
            return c.json({ message: 'Task not found' }, 404);
        }

        const isProjectManager = task.project.managerId === userId;
        const isAssignee = task.assignees.some(a => a.id === userId);

        if (role === ROLES.MANAGER && isProjectManager) return await next();
        if (role === ROLES.EMPLOYEE && isAssignee) return await next();

        return c.json({ message: 'Access denied: You are not assigned to this task' }, 403);
    } catch (error) {
        return c.json({ message: 'Internal server error during task authorization' }, 500);
    }
};

/**
 * Middleware to check chat ownership/access.
 */
export const validateChatAccess = async (c, next) => {
    const user = c.get('user');
    const userId = user.id;
    const chatId = c.req.param('chatId') || (await c.req.json().catch(() => ({}))).chatId;

    if (!chatId) return await next();

    if (user.role === ROLES.ADMIN) return await next();

    try {
        const participant = await prisma.chatParticipant.findUnique({
            where: {
                chatId_userId: { chatId, userId }
            }
        });

        if (!participant) {
            return c.json({ message: 'Access denied: You are not a participant in this chat' }, 403);
        }

        await next();
    } catch (error) {
        return c.json({ message: 'Error validating chat access' }, 500);
    }
};
