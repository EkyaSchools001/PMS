import { Hono } from 'hono';
import prisma from '../../utils/prisma.js';
import { hashPassword, comparePassword } from '../../utils/password.js';
import { generateToken } from '../../utils/jwt.js';
import { authenticate, authorize } from '../../middlewares/honoAuth.js';

export const authRoutes = new Hono();

authRoutes.post('/register', authenticate, authorize(['ADMIN']), async (c) => {
    try {
        const { email, password, fullName, role } = await c.req.json();

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return c.json({ message: 'User already exists' }, 400);
        }

        const passwordHash = await hashPassword(password);

        const user = await prisma.user.create({
            data: {
                email,
                passwordHash,
                fullName,
                role: role || 'EMPLOYEE',
            },
        });

        const token = generateToken(user.id, user.role);

        return c.json({
            message: 'User registered successfully',
            token,
            user: { id: user.id, email: user.email, role: user.role, fullName: user.fullName },
        }, 201);
    } catch (error) {
        console.error('Registration Error:', error);
        return c.json({ message: 'Server error', error: error.message }, 500);
    }
});

authRoutes.post('/login', async (c) => {
    try {
        const { email, password } = await c.req.json();
        const trimmedEmail = email ? email.trim() : '';

        const user = await prisma.user.findUnique({ where: { email: trimmedEmail } });
        if (!user) {
            return c.json({ message: 'Invalid credentials' }, 400);
        }

        const isMatch = await comparePassword(password, user.passwordHash);
        if (!isMatch) {
            return c.json({ message: 'Invalid credentials' }, 400);
        }

        const token = generateToken(user.id, user.role);

        return c.json({
            message: 'Login successful',
            token,
            user: { id: user.id, email: user.email, role: user.role, fullName: user.fullName },
        });
    } catch (error) {
        console.error('Login Error:', error);
        return c.json({ message: 'Server error', error: error.message }, 500);
    }
});
