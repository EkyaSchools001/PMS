const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');

const { authenticate } = require('../middlewares/authMiddleware');

const prisma = new PrismaClient();

router.use(authenticate);

// Get all users (for team members page and chat)
router.get('/', async (req, res) => {
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
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch users' });
    }
});

// Update user profile
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { fullName, email, role, department, managerId, dateOfBirth } = req.body;
        const currentUser = req.user;



        // Check if user exists
        const userToUpdate = await prisma.user.findUnique({
            where: { id }
        });

        if (!userToUpdate) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Role-based access control
        const isAdmin = currentUser.role === 'ADMIN';
        const isManager = currentUser.role === 'MANAGER';
        const isOwnProfile = currentUser.id === id;

        // Only Admin and Manager can edit other users' profiles
        if (!isOwnProfile && !isAdmin && !isManager) {
            return res.status(403).json({
                message: 'You do not have permission to edit other users\' profiles'
            });
        }

        // Prepare update data
        const updateData = {};

        if (fullName !== undefined) {
            updateData.fullName = fullName.trim();
        }

        if (email !== undefined) {
            // Check if email is already taken by another user
            const existingUser = await prisma.user.findFirst({
                where: {
                    email: email.trim(),
                    NOT: { id }
                }
            });

            if (existingUser) {
                return res.status(400).json({ message: 'Email is already in use' });
            }

            updateData.email = email.trim();
        }

        // Only Admin and Manager can change roles
        if (role !== undefined) {
            if (!isAdmin && !isManager) {
                return res.status(403).json({
                    message: 'Only Admins and Managers can change user roles'
                });
            }
            updateData.role = role;
        }

        if (req.body.profilePicture !== undefined) {
            updateData.profilePicture = req.body.profilePicture;
        }

        if (department !== undefined) {
            updateData.department = department;
        }

        if (managerId !== undefined) {
            updateData.managerId = managerId || null; // Allow clearing manager
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

        res.json(updatedUser);
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ message: 'Failed to update user profile' });
    }
});

module.exports = router;
