const prisma = require('../utils/prisma');

// Create Task
const createTask = async (req, res) => {
    try {
        const { title, description, priority, dueDate, projectId, assigneeId } = req.body;

        const task = await prisma.task.create({
            data: {
                title,
                description,
                priority: priority || 'MEDIUM',
                dueDate: dueDate ? new Date(dueDate) : null,
                projectId,
                assigneeId,
            },
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
        const tasks = await prisma.task.findMany({
            where: { projectId },
            include: {
                assignee: { select: { fullName: true, email: true } },
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
