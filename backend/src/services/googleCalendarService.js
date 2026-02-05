const getClientParams = () => ({
    clientId: process.env.GOOGLE_CLIENT_ID || globalThis.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || globalThis.GOOGLE_CLIENT_SECRET,
    redirectUri: process.env.GOOGLE_REDIRECT_URI || globalThis.GOOGLE_REDIRECT_URI
});

export const getAuthUrl = () => {
    const { clientId, redirectUri } = getClientParams();
    const scopes = [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/userinfo.email',
    ].join(' '); // Space separated scopes

    const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: scopes,
        access_type: 'offline',
        prompt: 'consent'
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
};

export const getTokens = async (code) => {
    const { clientId, clientSecret, redirectUri } = getClientParams();

    const params = new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
    });

    const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params.toString()
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(`Failed to get tokens: ${JSON.stringify(error)}`);
    }

    return await response.json();
};

const callCalendarApi = async (accessToken, endpoint, method = 'GET', body = null) => {
    const url = `https://www.googleapis.com/calendar/v3${endpoint}`;
    const options = {
        method,
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
    };

    if (body) {
        options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Google Calendar API error: ${JSON.stringify(errorData)}`);
    }

    if (method === 'DELETE') return true;
    return await response.json();
};

export const createCalendarEvent = async (user, meeting) => {
    if (!user.googleAccessToken) return null;

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

    if (meeting.isOnline && meeting.meetingLink) {
        event.location = meeting.meetingLink;
    }

    try {
        return await callCalendarApi(user.googleAccessToken, '/calendars/primary/events', 'POST', event);
    } catch (error) {
        console.error('Error creating Google Calendar event:', error);
        throw error;
    }
};

export const updateCalendarEvent = async (user, googleEventId, meeting) => {
    if (!user.googleAccessToken || !googleEventId) return null;

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
        return await callCalendarApi(user.googleAccessToken, `/calendars/primary/events/${googleEventId}`, 'PATCH', event);
    } catch (error) {
        console.error('Error updating Google Calendar event:', error);
        throw error;
    }
};

export const deleteCalendarEvent = async (user, googleEventId) => {
    if (!user.googleAccessToken || !googleEventId) return null;

    try {
        return await callCalendarApi(user.googleAccessToken, `/calendars/primary/events/${googleEventId}`, 'DELETE');
    } catch (error) {
        console.error('Error deleting Google Calendar event:', error);
        throw error;
    }
};
