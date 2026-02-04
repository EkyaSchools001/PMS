import { Hono } from 'hono';
import { getAuthUrl, getTokens } from '../../services/googleCalendarService.js';
import prisma from '../../utils/prisma.js';
import { authenticate } from '../../middlewares/honoAuth.js';

export const calendarAuthRoutes = new Hono();

calendarAuthRoutes.use('*', authenticate);

calendarAuthRoutes.get('/google', (c) => {
    const authUrl = getAuthUrl();
    return c.json({ url: authUrl });
});

calendarAuthRoutes.get('/google/callback', async (c) => {
    const { code } = c.req.query();

    // In a real app, you'd handle the state.
    // Redirect to frontend
    const frontendUrl = process.env.FRONTEND_URL || globalThis.FRONTEND_URL || '';
    return c.redirect(`${frontendUrl}/calendar?code=${code}`);
});

calendarAuthRoutes.post('/google/tokens', async (c) => {
    try {
        const { code } = await c.req.json();
        const user = c.get('user');

        const tokens = await getTokens(code);

        // Update user with tokens
        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: {
                googleAccessToken: tokens.access_token,
                googleRefreshToken: tokens.refresh_token,
            },
        });

        return c.json({ message: 'Successfully connected to Google Calendar', user: updatedUser });
    } catch (error) {
        console.error('Google token exchange error:', error);
        return c.json({ message: 'Failed to exchange tokens' }, 500);
    }
});

calendarAuthRoutes.get('/google/status', async (c) => {
    try {
        const user = c.get('user');
        const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { googleAccessToken: true, googleRefreshToken: true }
        });

        return c.json({ isConnected: !!(dbUser.googleAccessToken && dbUser.googleRefreshToken) });
    } catch (error) {
        return c.json({ message: 'Failed to get connection status' }, 500);
    }
});
