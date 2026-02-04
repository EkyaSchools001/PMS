import { google } from 'googleapis';

const getClientParams = () => ({
    clientId: process.env.GOOGLE_CLIENT_ID || globalThis.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || globalThis.GOOGLE_CLIENT_SECRET,
    redirectUri: process.env.GOOGLE_REDIRECT_URI || globalThis.GOOGLE_REDIRECT_URI
});

const createOAuth2Client = () => {
    const { clientId, clientSecret, redirectUri } = getClientParams();
    return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
};

export const getAuthUrl = () => {
    const oauth2Client = createOAuth2Client();
    const scopes = [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/userinfo.email',
    ];

    return oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes,
        prompt: 'consent',
    });
};

export const getTokens = async (code) => {
    const oauth2Client = createOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);
    return tokens;
};

export const getGoogleCalendar = (accessToken, refreshToken) => {
    const { clientId, clientSecret, redirectUri } = getClientParams();
    const auth = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

    auth.setCredentials({
        access_token: accessToken,
        refresh_token: refreshToken,
    });

    return google.calendar({ version: 'v3', auth });
};

export const createCalendarEvent = async (user, meeting) => {
    if (!user.googleAccessToken || !user.googleRefreshToken) {
        return null;
    }

    const calendar = getGoogleCalendar(user.googleAccessToken, user.googleRefreshToken);

    const event = {
        summary: meeting.title,
        description: meeting.description || '',
        start: {
            dateTime: new Date(meeting.startTime).toISOString(),
            timeZone: 'UTC',
        },
        end: {
            dateTime: new Date(meeting.endTime).toISOString(),
            timeZone: 'UTC',
        },
        reminders: {
            useDefault: false,
            overrides: [
                { method: 'email', minutes: 24 * 60 },
                { method: 'popup', minutes: 10 },
            ],
        },
    };

    if (meeting.isOnline && meeting.meetingLink) {
        event.location = meeting.meetingLink;
    } else if (meeting.room) {
        event.location = meeting.room.name || meeting.room.location;
    }

    try {
        const response = await calendar.events.insert({
            calendarId: 'primary',
            resource: event,
        });
        return response.data;
    } catch (error) {
        console.error('Error creating Google Calendar event:', error);
        throw error;
    }
};

export const updateCalendarEvent = async (user, googleEventId, meeting) => {
    if (!user.googleAccessToken || !user.googleRefreshToken || !googleEventId) {
        return null;
    }

    const calendar = getGoogleCalendar(user.googleAccessToken, user.googleRefreshToken);

    const event = {
        summary: meeting.title,
        description: meeting.description || '',
        start: {
            dateTime: new Date(meeting.startTime).toISOString(),
            timeZone: 'UTC',
        },
        end: {
            dateTime: new Date(meeting.endTime).toISOString(),
            timeZone: 'UTC',
        },
    };

    try {
        const response = await calendar.events.patch({
            calendarId: 'primary',
            eventId: googleEventId,
            resource: event,
        });
        return response.data;
    } catch (error) {
        console.error('Error updating Google Calendar event:', error);
        throw error;
    }
};

export const deleteCalendarEvent = async (user, googleEventId) => {
    if (!user.googleAccessToken || !user.googleRefreshToken || !googleEventId) {
        return null;
    }

    const calendar = getGoogleCalendar(user.googleAccessToken, user.googleRefreshToken);

    try {
        await calendar.events.delete({
            calendarId: 'primary',
            eventId: googleEventId,
        });
        return true;
    } catch (error) {
        console.error('Error deleting Google Calendar event:', error);
        throw error;
    }
};
