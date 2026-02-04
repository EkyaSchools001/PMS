import { Hono } from 'hono';
import prisma from '../../utils/prisma.js';
import { hashPassword } from '../../utils/password.js';
import { authenticate, authorize } from '../../middlewares/honoAuth.js';

export const userRoutes = new Hono();

userRoutes.use('*', authenticate);

// Create new user (Admin only)
userRoutes.post('/', authorize(['ADMIN']), async (c) => {
    try {
        const { fullName, email, password, role, department, managerId, dateOfBirth } = await c.req.json();

        if (!fullName || !email || !password) {
            return c.json({ message: 'Full name, email and password are required' }, 400);
        }

        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { email: email.trim() }
        });

        if (existingUser) {
            return c.json({ message: 'User with this email already exists' }, 400);
        }

        const hashedPassword = await hashPassword(password);

        const newUser = await prisma.user.create({
            data: {
                fullName: fullName.trim(),
                email: email.trim(),
                passwordHash: hashedPassword,
                role: role || 'EMPLOYEE',
                department: department || null,
                managerId: managerId || null,
                dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null
            },
            select: {
                id: true,
                email: true,
                fullName: true,
                role: true,
                department: true,
                createdAt: true
            }
        });

        return c.json(newUser, 201);
    } catch (error) {
        console.error('Error creating user:', error);
        return c.json({ message: 'Failed to create user', error: error.message }, 500);
    }
});

// Get all users (for team members page and chat)
userRoutes.get('/', async (c) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                fullName: true,
                role: true,
                department: true,
                dateOfBirth: true,
                profilePicture: true,
                createdAt: true,
                manager: {
                    select: {
                        id: true,
                        fullName: true
                    }
                },
                managedProjects: {
                    select: {
                        id: true,
                        name: true,
                        status: true,
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        return c.json(users);
    } catch (error) {
        return c.json({ message: 'Failed to fetch users' }, 500);
    }
});

// Update user profile
userRoutes.put('/:id', async (c) => {
    try {
        const { id } = c.req.param();
        const { fullName, email, role, department, managerId, dateOfBirth, profilePicture } = await c.req.json();
        const currentUser = c.get('user');

        // Check if user exists
        const userToUpdate = await prisma.user.findUnique({
            where: { id }
        });

        if (!userToUpdate) {
            return c.json({ message: 'User not found' }, 404);
        }

        // Role-based access control
        const isAdmin = currentUser.role === 'ADMIN';
        const isManager = currentUser.role === 'MANAGER';
        const isOwnProfile = currentUser.id === id;

        // Only Admin and Manager can edit other users' profiles
        if (!isOwnProfile && !isAdmin && !isManager) {
            return c.json({
                message: 'You do not have permission to edit other users\' profiles'
            }, 403);
        }

        // Managers cannot edit Admin profiles
        if (isManager && !isAdmin && userToUpdate.role === 'ADMIN') {
            return c.json({
                message: 'Managers cannot edit administrator profiles'
            }, 403);
        }

        // Prepare update data
        const updateData = {};

        if (fullName !== undefined) updateData.fullName = fullName.trim();
        if (email !== undefined) {
            const existingUser = await prisma.user.findFirst({
                where: {
                    email: email.trim(),
                    NOT: { id }
                }
            });
            if (existingUser) {
                return c.json({ message: 'Email is already in use' }, 400);
            }
            updateData.email = email.trim();
        }

        if (role !== undefined) {
            if (!isAdmin) return c.json({ message: 'Only Admins can change user roles' }, 403);
            updateData.role = role;
        }

        if (profilePicture !== undefined) updateData.profilePicture = profilePicture;
        if (department !== undefined) updateData.department = department;

        if (managerId !== undefined) {
            if (!isAdmin) return c.json({ message: 'Only Admins can assign or change reporting managers' }, 403);
            updateData.managerId = managerId || null;
        }

        if (dateOfBirth !== undefined) {
            updateData.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;
        }

        // Update user
        const updatedUser = await prisma.user.update({
            where: { id },
            data: updateData,
            select: {
                id: true,
                email: true,
                fullName: true,
                role: true,
                profilePicture: true,
                createdAt: true
            }
        });

        return c.json(updatedUser);
    } catch (error) {
        console.error('Error updating user:', error);
        return c.json({ message: 'Failed to update user profile' }, 500);
    }
});
