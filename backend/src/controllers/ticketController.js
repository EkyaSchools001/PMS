import prisma from '../utils/prisma.js';
import { sendTicketEmail } from '../services/emailService.js';
import { createNotification } from './notificationController.js';

/**
 * @desc    Create a new ticket
 */
export const createTicket = async (c) => {
    try {
        let { title, description, priority, projectId, assigneeId, campus, category } = await c.req.json();
        const user = c.get('user');
        const reporterId = user.id;

        // Ensure a projectId exists (for chatbot compatibility)
        if (!projectId) {
            const firstProject = await prisma.project.findFirst();
            projectId = firstProject?.id;
        }

        if (!projectId) {
            return c.json({ message: 'No project found to associate ticket with.' }, 400);
        }

        // Set SLA Deadline based on priority
        let slaDeadline = new Date();
        if (priority === 'CRITICAL') slaDeadline.setHours(slaDeadline.getHours() + 4);
        else if (priority === 'HIGH') slaDeadline.setHours(slaDeadline.getHours() + 12);
        else if (priority === 'MEDIUM') slaDeadline.setHours(slaDeadline.getHours() + 48);
        else slaDeadline.setHours(slaDeadline.getHours() + 120); // 5 days for LOW

        const ticket = await prisma.ticket.create({
            data: {
                title,
                description,
                priority,
                projectId,
                reporterId,
                assigneeId,
                campus,
                category,
                slaDeadline,
                lastReminderSentAt: new Date()
            },
            include: {
                assignee: true,
                reporter: true,
                project: { select: { name: true } }
            }
        });

        // Notify Managers of the campus
        const managers = await prisma.user.findMany({
            where: {
                role: 'MANAGER',
                campusAccess: { contains: campus }
            }
        });

        managers.forEach(mgr => {
            createNotification(
                mgr.id,
                'REMINDER',
                'New Ticket Raised',
                `A new ${priority} priority ticket has been raised for ${campus} campus.`,
                `/manager-dashboard`
            ).catch(err => console.error('Ticket notification fail:', err));
        });

        // Create Audit Log
        await prisma.auditLog.create({
            data: {
                action: 'CREATED',
                entityType: 'TICKET',
                entityId: ticket.id,
                userId: reporterId,
                details: `Ticket created with priority ${priority}`
            }
        });

        return c.json(ticket, 201);
    } catch (error) {
        console.error('Create Ticket Error:', error);
        return c.json({ message: 'Server error creating ticket' }, 500);
    }
};

/**
 * @desc    Get all tickets (filtered by user role and campus)
 */
export const getTickets = async (c) => {
    try {
        const user = c.get('user');
        const userId = user.id;
        const userRole = user.role;
        const campusAccess = user.campusAccess ? user.campusAccess.split(',') : [];

        let where = {};

        if (userRole === 'ADMIN') {
            // See everything
        } else if (userRole === 'MANAGER') {
            where = {
                campus: { in: campusAccess }
            };
        } else {
            where = {
                OR: [
                    { reporterId: userId },
                    { assigneeId: userId }
                ]
            };
        }

        const tickets = await prisma.ticket.findMany({
            where,
            include: {
                assignee: { select: { id: true, fullName: true, email: true } },
                reporter: { select: { id: true, fullName: true, email: true } },
                project: { select: { id: true, name: true } },
                comments: {
                    include: { author: { select: { fullName: true } } },
                    orderBy: { createdAt: 'asc' }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return c.json(tickets);
    } catch (error) {
        console.error('Get Tickets Error:', error);
        return c.json({ message: 'Server error fetching tickets' }, 500);
    }
};

/**
 * @desc    Update ticket status, priority, or assignment
 */
export const updateTicket = async (c) => {
    try {
        const { id } = c.req.param();
        const { status, priority, description, assigneeId } = await c.req.json();
        const user = c.get('user');

        const ticket = await prisma.ticket.update({
            where: { id },
            data: { status, priority, description, assigneeId },
            include: { assignee: true, reporter: true, project: true }
        });

        if (assigneeId) {
            createNotification(
                assigneeId,
                'TICKET_ASSIGNED',
                'Ticket Assigned',
                `You have been assigned to ticket: "${ticket.title}"`,
                `/manager-dashboard`
            ).catch(err => console.error('Ticket assignment notify fail:', err));
        }

        if (status && status !== ticket.status) {
            const managers = await prisma.user.findMany({
                where: {
                    role: 'MANAGER',
                    campusAccess: { contains: ticket.campus }
                }
            });

            managers.forEach(mgr => {
                createNotification(
                    mgr.id,
                    'SYSTEM',
                    'Ticket Status Updated',
                    `Ticket "${ticket.title}" status changed to ${status}`,
                    `/manager-dashboard`
                ).catch(err => console.error('Ticket status notify fail:', err));
            });
        }

        // Create Audit Log
        await prisma.auditLog.create({
            data: {
                action: 'UPDATED',
                entityType: 'TICKET',
                entityId: id,
                userId: user.id,
                details: JSON.stringify({ status, priority, assigneeId })
            }
        });

        return c.json(ticket);

    } catch (error) {
        console.error('Update Ticket Error:', error);
        return c.json({ message: 'Server error updating ticket' }, 500);
    }
};

export const addTicketComment = async (c) => {
    try {
        const { id: ticketId } = c.req.param();
        const { content } = await c.req.json();
        const user = c.get('user');
        const authorId = user.id;

        const comment = await prisma.ticketComment.create({
            data: {
                content,
                ticketId,
                authorId
            },
            include: { author: { select: { fullName: true } } }
        });

        return c.json(comment, 201);
    } catch (error) {
        return c.json({ message: 'Error adding comment' }, 500);
    }
};

export const getTicketStatus = async (c) => {
    try {
        const { id: inputId } = c.req.param();
        const user = c.get('user');

        let ticket = await prisma.ticket.findUnique({
            where: { id: inputId },
            include: {
                assignee: { select: { fullName: true } },
                reporter: { select: { fullName: true, id: true } }
            }
        });

        if (!ticket) {
            ticket = await prisma.ticket.findFirst({
                where: {
                    id: { startsWith: inputId }
                },
                include: {
                    assignee: { select: { fullName: true } },
                    reporter: { select: { fullName: true, id: true } }
                }
            });
        }

        if (!ticket) {
            return c.json({ message: 'Ticket not found.' }, 404);
        }

        const isOwner = ticket.reporterId === user.id;
        const isAdmin = user.role === 'ADMIN';
        const campusAccessList = user.campusAccess ? user.campusAccess.split(',').map(c => c.trim()) : [];
        const isManager = user.role === 'MANAGER' && campusAccessList.includes(ticket.campus);

        if (!isOwner && !isAdmin && !isManager) {
            return c.json({ message: 'You don’t have permission to view this ticket.' }, 403);
        }

        return c.json(ticket);
    } catch (error) {
        return c.json({ message: 'Unable to fetch ticket details.' }, 500);
    }
};

export const getRecentTickets = async (c) => {
    try {
        const user = c.get('user');
        let where = { reporterId: user.id };

        if (user.role === 'ADMIN') {
            where = {};
        } else if (user.role === 'MANAGER') {
            const campusAccess = user.campusAccess ? user.campusAccess.split(',') : [];
            where = { campus: { in: campusAccess } };
        }

        const tickets = await prisma.ticket.findMany({
            where,
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: {
                assignee: { select: { fullName: true } }
            }
        });

        return c.json(tickets);
    } catch (error) {
        return c.json({ message: 'Unable to fetch recent tickets.' }, 500);
    }
};

export const getTicketLogs = async (c) => {
    try {
        const { id } = c.req.param();
        const logs = await prisma.auditLog.findMany({
            where: {
                entityType: 'TICKET',
                entityId: id
            },
            include: { user: { select: { fullName: true } } },
            orderBy: { createdAt: 'desc' }
        });
        return c.json(logs);
    } catch (error) {
        return c.json({ message: 'Error fetching logs' }, 500);
    }
};
