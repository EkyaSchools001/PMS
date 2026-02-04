import prisma from '../utils/prisma.js';
import { ROLES } from '../utils/policies.js';
import { createNotification } from './notificationController.js';

// Create a new project
export const createProject = async (c) => {
    try {
        const { name, description, startDate, endDate, budget, customerId, managerId: selectedManagerId, memberIds = [] } = await c.req.json();
        const user = c.get('user');
        const creatorId = user.id;
        const managerId = selectedManagerId || creatorId;

        // Combine all unique participants (manager, members, creator)
        const allMemberIds = Array.from(new Set([managerId, creatorId, ...memberIds]));

        const project = await prisma.project.create({
            data: {
                name,
                description,
                startDate: startDate ? new Date(startDate) : null,
                endDate: endDate ? new Date(endDate) : null,
                budget: budget ? parseFloat(budget) : 0,
                managerId,
                customerId,
                members: {
                    connect: allMemberIds.map(id => ({ id }))
                }
            },
        });

        // Create Project Group Chat
        const chatParticipants = allMemberIds.map(id => ({ userId: id }));
        if (customerId && !allMemberIds.includes(customerId)) {
            chatParticipants.push({ userId: customerId });
        }

        await prisma.chat.create({
            data: {
                type: 'PROJECT_GROUP',
                name: `${name} Group`,
                projectId: project.id,
                participants: {
                    create: chatParticipants
                }
            }
        });

        // Trigger notifications for participants
        allMemberIds.forEach(userId => {
            if (userId !== creatorId) {
                createNotification(
                    userId,
                    'PROJECT_INVITE',
                    'Added to New Project',
                    `You have been added to the project: "${name}"`,
                    `/projects/${project.id}`
                );
            }
        });

        return c.json(project, 201);
    } catch (error) {
        return c.json({ message: 'Error creating project', error: error.message }, 500);
    }
};

// Get all projects (Admin sees all, Manager sees theirs, Employee sees assigned)
export const getProjects = async (c) => {
    try {
        const user = c.get('user');
        const { role, id } = user;
        let where = {};

        if (role === ROLES.MANAGER) {
            where = { managerId: id };
        } else if (role === ROLES.EMPLOYEE) {
            where = {
                members: {
                    some: {
                        id: id,
                    },
                },
            };
        } else if (role === ROLES.CUSTOMER) {
            where = { customerId: id };
        }

        const projects = await prisma.project.findMany({
            where,
            include: {
                manager: { select: { fullName: true, email: true } },
                customer: { select: { fullName: true, email: true } },
                tasks: {
                    select: {
                        id: true,
                        title: true,
                        status: true,
                        startDate: true,
                        dueDate: true,
                        priority: true
                    }
                },
                _count: { select: { tasks: true } },
            },
        });

        return c.json(projects);
    } catch (error) {
        return c.json({ message: 'Error fetching projects', error: error.message }, 500);
    }
};

// Get single project details
export const getProjectById = async (c) => {
    try {
        const { id } = c.req.param();
        const project = await prisma.project.findUnique({
            where: { id },
            include: {
                tasks: {
                    include: {
                        assignees: { select: { id: true, fullName: true } }
                    }
                },
                tickets: {
                    include: {
                        assignee: { select: { fullName: true } },
                        reporter: { select: { fullName: true } }
                    }
                },
                manager: { select: { fullName: true } },
                members: { select: { id: true, fullName: true, email: true, role: true } },
                chat: { select: { id: true } }
            },
        });

        if (!project) {
            return c.json({ message: 'Project not found' }, 404);
        }

        return c.json(project);
    } catch (error) {
        return c.json({ message: 'Error fetching project', error: error.message }, 500);
    }
};

// Update project
export const updateProject = async (c) => {
    try {
        const { id } = c.req.param();
        const data = await c.req.json();

        // Convert dates if present
        if (data.startDate) data.startDate = new Date(data.startDate);
        if (data.endDate) data.endDate = new Date(data.endDate);
        if (data.budget) data.budget = parseFloat(data.budget);

        const project = await prisma.project.update({
            where: { id },
            data,
            include: { chat: true }
        });

        // If customer was updated, add them to the chat if it exists
        if (data.customerId && project.chat) {
            await prisma.chatParticipant.create({
                data: {
                    chatId: project.chat.id,
                    userId: data.customerId
                }
            }).catch(() => { }); // Ignore if already in chat
        }

        return c.json(project);
    } catch (error) {
        return c.json({ message: 'Error updating project', error: error.message }, 500);
    }
};

// Delete project
export const deleteProject = async (c) => {
    try {
        const { id } = c.req.param();
        await prisma.project.delete({ where: { id } });
        return c.json({ message: 'Project deleted successfully' });
    } catch (error) {
        return c.json({ message: 'Error deleting project', error: error.message }, 500);
    }
};

// Add member to project
export const addMember = async (c) => {
    try {
        const { id } = c.req.param();
        const { userId } = await c.req.json();

        const project = await prisma.project.update({
            where: { id },
            data: {
                members: {
                    connect: { id: userId }
                }
            },
            include: { chat: true }
        });

        // Add to project chat if exists
        if (project.chat) {
            await prisma.chatParticipant.create({
                data: {
                    chatId: project.chat.id,
                    userId
                }
            }).catch(() => { }); // Ignore if already in chat
        }

        return c.json(project);
    } catch (error) {
        return c.json({ message: 'Error adding member', error: error.message }, 500);
    }
};

// Remove member from project
export const removeMember = async (c) => {
    try {
        const { id } = c.req.param();
        const { userId } = await c.req.json();

        const project = await prisma.project.update({
            where: { id },
            data: {
                members: {
                    disconnect: { id: userId }
                }
            },
            include: { chat: true }
        });

        // Remove from project chat
        if (project.chat) {
            await prisma.chatParticipant.deleteMany({
                where: {
                    chatId: project.chat.id,
                    userId
                }
            });
        }

        return c.json(project);
    } catch (error) {
        return c.json({ message: 'Error removing member', error: error.message }, 500);
    }
};
