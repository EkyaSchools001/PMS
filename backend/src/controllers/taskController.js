import prisma from '../utils/prisma.js';
import { ROLES } from '../utils/policies.js';
import { createNotification } from './notificationController.js';

// Create Task
export const createTask = async (c) => {
    try {
        const { title, description, priority, startDate, dueDate, projectId, assigneeIds } = await c.req.json();

        const task = await prisma.task.create({
            data: {
                title,
                description,
                priority: priority || 'MEDIUM',
                startDate: (startDate && startDate !== "") ? new Date(startDate) : null,
                dueDate: (dueDate && dueDate !== "") ? new Date(dueDate) : null,
                projectId,
                assignees: assigneeIds ? {
                    connect: assigneeIds.map(id => ({ id }))
                } : undefined,
            },
            include: {
                project: { select: { name: true } },
                assignees: { select: { id: true, fullName: true, email: true } }
            }
        });

        // Trigger notifications for each assignee
        if (assigneeIds && assigneeIds.length > 0) {
            assigneeIds.forEach(userId => {
                createNotification(
                    userId,
                    'TASK_ASSIGNED',
                    'New Task Assigned',
                    `You have been assigned to task: "${title}" in project "${task.project.name}"`,
                    `/tasks`
                );
            });
        }

        return c.json(task, 201);
    } catch (error) {
        return c.json({ message: 'Error creating task', error: error.message }, 500);
    }
};

// Get Tasks for a Project
export const getProjectTasks = async (c) => {
    try {
        const { projectId } = c.req.param();
        const user = c.get('user');
        const { role, id: userId } = user;

        let whereClause = { projectId };

        // Visibility Rules
        if (role === ROLES.EMPLOYEE) {
            // Employee sees only tasks assigned to them
            whereClause.assignees = {
                some: { id: userId }
            };
        } else if (role === ROLES.CUSTOMER) {
            // Customer sees NO internal tasks
            return c.json([]);
        }

        const tasks = await prisma.task.findMany({
            where: whereClause,
            include: {
                assignees: { select: { id: true, fullName: true, email: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
        return c.json(tasks);
    } catch (error) {
        return c.json({ message: 'Error fetching tasks', error: error.message }, 500);
    }
};

// Update Task Title and Dates (Manager/Admin only)
export const updateTask = async (c) => {
    try {
        const { id } = c.req.param();
        const { title, startDate, dueDate } = await c.req.json();

        const task = await prisma.task.update({
            where: { id },
            data: {
                title,
                startDate: (startDate && startDate !== "") ? new Date(startDate) : undefined,
                dueDate: (dueDate && dueDate !== "") ? new Date(dueDate) : undefined,
            },
        });

        return c.json(task);
    } catch (error) {
        return c.json({ message: 'Error updating task', error: error.message }, 500);
    }
};

// Update Task Status
export const updateTaskStatus = async (c) => {
    try {
        const { id } = c.req.param();
        const { status } = await c.req.json();

        const task = await prisma.task.update({
            where: { id },
            data: { status },
        });

        return c.json(task);
    } catch (error) {
        return c.json({ message: 'Error updating task status', error: error.message }, 500);
    }
};

// Get tasks assigned to the current user
export const getMyTasks = async (c) => {
    try {
        const user = c.get('user');
        const userId = user.id;

        const tasks = await prisma.task.findMany({
            where: {
                assignees: {
                    some: { id: userId }
                }
            },
            include: {
                project: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                assignees: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true
                    }
                }
            },
            orderBy: { dueDate: 'asc' }
        });

        return c.json(tasks);
    } catch (error) {
        return c.json({ message: 'Error fetching assigned tasks', error: error.message }, 500);
    }
};
