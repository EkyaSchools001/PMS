import prisma from '../utils/prisma.js';
import { sendTimeLogEmail } from '../services/emailService.js';

// Create Time Log
export const createTimeLog = async (c) => {
    try {
        const { date, hours, description, projectId, taskId } = await c.req.json();
        const user = c.get('user');
        const userId = user.id;

        if (!date || !hours || !projectId) {
            return c.json({ message: 'Missing required fields: date, hours, and projectId are required.' }, 400);
        }

        const numericHours = parseFloat(hours);
        if (isNaN(numericHours) || numericHours <= 0) {
            return c.json({ message: 'Hours must be a valid positive number.' }, 400);
        }

        const timeLog = await prisma.timeLog.create({
            data: {
                date: new Date(date),
                hours: numericHours,
                description,
                userId,
                projectId,
                taskId: taskId || null,
            },
            include: {
                user: { select: { fullName: true, email: true } },
                project: { select: { name: true } },
                task: { select: { title: true } }
            }
        });

        // Notify all users via email
        const allUsers = await prisma.user.findMany({ select: { email: true } });
        const emails = allUsers.map(u => u.email).filter(e => e);

        if (emails.length > 0) {
            sendTimeLogEmail(
                emails,
                'New Time Entry Logged',
                {
                    userName: timeLog.user.fullName,
                    projectName: timeLog.project.name,
                    taskName: timeLog.task?.title,
                    hours: timeLog.hours.toString(),
                    date: timeLog.date,
                    description: timeLog.description
                }
            ).catch(err => console.error('Time log email fail:', err));
        }

        return c.json(timeLog, 201);
    } catch (error) {
        console.error('Error creating time log:', error);
        return c.json({ message: 'Error logging hours', error: error.message }, 500);
    }
};

// Get Time Logs
export const getTimeLogs = async (c) => {
    try {
        const logs = await prisma.timeLog.findMany({
            include: {
                user: { select: { fullName: true } },
                project: { select: { name: true } },
                task: { select: { title: true } }
            },
            orderBy: { date: 'desc' }
        });
        return c.json(logs);
    } catch (error) {
        return c.json({ message: 'Error fetching time logs', error: error.message }, 500);
    }
};

// Get Dashboard Stats for Time Logs
export const getTimeStats = async (c) => {
    try {
        const totalHours = await prisma.timeLog.aggregate({
            _sum: { hours: true }
        });
        return c.json({ totalHours: totalHours._sum.hours || 0 });
    } catch (error) {
        return c.json({ message: 'Error fetching time stats', error: error.message }, 500);
    }
};
