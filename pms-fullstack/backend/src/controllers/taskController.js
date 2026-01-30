const prisma = require('../utils/prisma');
const { ROLES } = require('../utils/policies');

// Create Task
const createTask = async (req, res) => {
    try {
        const { title, description, priority, dueDate, projectId, assigneeIds } = req.body;

        const task = await prisma.task.create({
            data: {
                title,
                description,
                priority: priority || 'MEDIUM',
                dueDate: dueDate ? new Date(dueDate) : null,
                projectId,
                assignees: assigneeIds ? {
                    connect: assigneeIds.map(id => ({ id }))
                } : undefined,
            },
            include: {
                assignees: { select: { id: true, fullName: true, email: true } }
            }
        });

        res.status(201).json(task);
    } catch (error) {
        res.status(500).json({ message: 'Error creating task', error: error.message });
    }
};

// Get Tasks for a Project
const getProjectTasks = async (req, res) => {
    try {
        const { projectId } = req.params;
        const { role, id: userId } = req.user;

        let whereClause = { projectId };

        // Visibility Rules
        if (role === ROLES.EMPLOYEE) {
            // Employee sees only tasks assigned to them
            whereClause.assignees = {
                some: { id: userId }
            };
        } else if (role === ROLES.CUSTOMER) {
            // Customer sees NO internal tasks
            return res.json([]);
        }
        // ADMIN and MANAGER see all tasks

        const tasks = await prisma.task.findMany({
            where: whereClause,
            include: {
                assignees: { select: { id: true, fullName: true, email: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
        res.json(tasks);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching tasks', error: error.message });
    }
};

// Update Task Status (Employee can do this)
const updateTaskStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const task = await prisma.task.update({
            where: { id },
            data: { status },
        });

        res.json(task);
    } catch (error) {
        res.status(500).json({ message: 'Error updating task status', error: error.message });
    }
};

module.exports = { createTask, getProjectTasks, updateTaskStatus };
