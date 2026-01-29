const prisma = require('../utils/prisma');

// Create a new project
const createProject = async (req, res) => {
    try {
        const { name, description, startDate, endDate, budget, customerId } = req.body;
        const managerId = req.user.id; // From auth middleware

        const project = await prisma.project.create({
            data: {
                name,
                description,
                startDate: startDate ? new Date(startDate) : null,
                endDate: endDate ? new Date(endDate) : null,
                budget: budget ? parseFloat(budget) : 0,
                managerId,
                customerId,
            },
        });

        res.status(201).json(project);
    } catch (error) {
        res.status(500).json({ message: 'Error creating project', error: error.message });
    }
};

// Get all projects (Admin sees all, Manager sees theirs, Employee sees assigned)
const getProjects = async (req, res) => {
    try {
        const { role, id } = req.user;
        let where = {};

        if (role === 'MANAGER') {
            where = { managerId: id };
        } else if (role === 'EMPLOYEE') {
            // Employees see projects they have tasks in
            where = {
                tasks: {
                    some: {
                        assigneeId: id,
                    },
                },
            };
        } else if (role === 'CUSTOMER') {
            where = { customerId: id };
        }
        // Admin sees all (empty where)

        const projects = await prisma.project.findMany({
            where,
            include: {
                manager: { select: { fullName: true, email: true } },
                customer: { select: { fullName: true, email: true } },
                _count: { select: { tasks: true } },
            },
        });

        res.json(projects);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching projects', error: error.message });
    }
};

// Get single project details
const getProjectById = async (req, res) => {
    try {
        const { id } = req.params;
        const project = await prisma.project.findUnique({
            where: { id },
            include: {
                tasks: true,
                manager: { select: { fullName: true } },
            },
        });

        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        res.json(project);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching project', error: error.message });
    }
};

// Update project
const updateProject = async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;

        // Convert dates if present
        if (data.startDate) data.startDate = new Date(data.startDate);
        if (data.endDate) data.endDate = new Date(data.endDate);
        if (data.budget) data.budget = parseFloat(data.budget);

        const project = await prisma.project.update({
            where: { id },
            data,
        });

        res.json(project);
    } catch (error) {
        res.status(500).json({ message: 'Error updating project', error: error.message });
    }
};

// Delete project
const deleteProject = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.project.delete({ where: { id } });
        res.json({ message: 'Project deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting project', error: error.message });
    }
};

module.exports = {
    createProject,
    getProjects,
    getProjectById,
    updateProject,
    deleteProject,
};
