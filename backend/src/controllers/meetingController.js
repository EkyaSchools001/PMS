import prisma from '../utils/prisma.js';
import { sendMeetingEmail } from '../services/emailService.js';
import { createCalendarEvent, updateCalendarEvent, deleteCalendarEvent } from '../services/googleCalendarService.js';

/**
 * @desc    Get meetings for current user
 */
export const getMeetings = async (c) => {
    try {
        const user = c.get('user');
        const meetings = await prisma.meeting.findMany({
            where: {
                OR: [
                    { organizerId: user.id },
                    { participants: { some: { userId: user.id } } }
                ]
            },
            include: {
                organizer: { select: { id: true, fullName: true, email: true } },
                participants: {
                    include: {
                        user: { select: { id: true, fullName: true, email: true } }
                    }
                },
                room: true,
                project: { select: { id: true, name: true } }
            },
            orderBy: { startTime: 'asc' }
        });
        return c.json(meetings);
    } catch (error) {
        return c.json({ message: 'Error fetching meetings', error: error.message }, 500);
    }
};

/**
 * @desc    Schedule a meeting
 */
export const scheduleMeeting = async (c) => {
    try {
        const user = c.get('user');
        const { title, description, startTime, endTime, isOnline, meetingLink, roomId, projectId, participantIds } = await c.req.json();

        const start = new Date(startTime);
        const end = new Date(endTime);

        // 1. Validate Room Availability (if roomId provided)
        if (roomId) {
            const overlap = await prisma.meeting.findFirst({
                where: {
                    roomId,
                    status: 'SCHEDULED',
                    OR: [
                        { startTime: { lt: end }, endTime: { gt: start } }
                    ]
                }
            });

            if (overlap && user.role !== 'ADMIN') {
                return c.json({ message: 'Room is already booked for this time slot.' }, 400);
            }

            // Check if room is blocked
            const blocked = await prisma.roomBlockedSlot.findFirst({
                where: {
                    roomId,
                    OR: [
                        { startTime: { lt: end }, endTime: { gt: start } }
                    ]
                }
            });

            if (blocked && user.role !== 'ADMIN') {
                return c.json({ message: 'Room is blocked for maintenance or another event.' }, 400);
            }
        }

        // 2. Create Meeting
        const meeting = await prisma.meeting.create({
            data: {
                title,
                description,
                startTime: start,
                endTime: end,
                isOnline,
                meetingLink,
                roomId: roomId || null,
                projectId: projectId || null,
                organizerId: user.id,
                participants: {
                    create: [
                        { userId: user.id, role: 'ORGANIZER', status: 'ACCEPTED' },
                        ...(participantIds || [])
                            .filter(id => id !== user.id)
                            .map(id => ({ userId: id, role: 'ATTENDEE', status: 'PENDING' }))
                    ]
                }
            },
            include: {
                participants: true
            }
        });

        // 3. Log Activity
        await prisma.auditLog.create({
            data: {
                action: 'MEETING_CREATED',
                entityType: 'MEETING',
                entityId: meeting.id,
                userId: user.id,
                details: `Scheduled meeting: ${title}`
            }
        });

        // 4. Send Email Notifications (Async)
        const participants = await prisma.user.findMany({
            where: { id: { in: participantIds || [] } },
            select: { email: true }
        });

        const room = roomId ? await prisma.meetingRoom.findUnique({ where: { id: roomId } }) : null;

        // Note: Emails are non-blocking
        participants.forEach(p => {
            sendMeetingEmail(p.email, 'New Meeting Invitation', {
                title,
                startTime: start,
                endTime: end,
                isOnline,
                meetingLink,
                roomName: room?.name,
                organizerName: user.fullName
            }).catch(err => console.error('Meeting email fail:', err));
        });

        // 5. Sync with Google Calendar (if connected)
        try {
            const dbUser = await prisma.user.findUnique({
                where: { id: user.id }
            });

            if (dbUser.googleAccessToken && dbUser.googleRefreshToken) {
                const roomInfo = roomId ? await prisma.meetingRoom.findUnique({ where: { id: roomId } }) : null;
                const googleEvent = await createCalendarEvent(dbUser, {
                    ...meeting,
                    room: roomInfo
                });

                if (googleEvent && googleEvent.id) {
                    await prisma.meeting.update({
                        where: { id: meeting.id },
                        data: { googleEventId: googleEvent.id }
                    });
                }
            }
        } catch (syncError) {
            console.error('Failed to sync with Google Calendar:', syncError);
        }

        return c.json(meeting, 201);
    } catch (error) {
        return c.json({ message: 'Error scheduling meeting', error: error.message }, 500);
    }
};

/**
 * @desc    RSVP to a meeting
 */
export const rsvpMeeting = async (c) => {
    try {
        const { id } = c.req.param();
        const { status } = await c.req.json();
        const user = c.get('user');

        const participant = await prisma.meetingParticipant.update({
            where: {
                meetingId_userId: {
                    meetingId: id,
                    userId: user.id
                }
            },
            data: { status }
        });

        return c.json(participant);
    } catch (error) {
        return c.json({ message: 'Error responding to invite', error: error.message }, 500);
    }
};

/**
 * @desc    Cancel a meeting
 */
export const cancelMeeting = async (c) => {
    try {
        const { id } = c.req.param();
        const user = c.get('user');

        const meeting = await prisma.meeting.findUnique({ where: { id } });

        if (!meeting) return c.json({ message: 'Meeting not found' }, 404);

        if (meeting.organizerId !== user.id && user.role !== 'ADMIN') {
            return c.json({ message: 'Only the organizer can cancel this meeting.' }, 403);
        }

        await prisma.meeting.update({
            where: { id },
            data: { status: 'CANCELLED' }
        });

        // Sync with Google Calendar
        try {
            const dbUser = await prisma.user.findUnique({
                where: { id: user.id }
            });

            if (dbUser.googleAccessToken && dbUser.googleRefreshToken && meeting.googleEventId) {
                await deleteCalendarEvent(dbUser, meeting.googleEventId);
            }
        } catch (syncError) {
            console.error('Failed to delete Google Calendar event:', syncError);
        }

        return c.json({ message: 'Meeting cancelled' });
    } catch (error) {
        return c.json({ message: 'Error cancelling meeting', error: error.message }, 500);
    }
};

/**
 * @desc    Update a meeting
 */
export const updateMeeting = async (c) => {
    try {
        const { id } = c.req.param();
        const user = c.get('user');
        const { title, description, startTime, endTime, isOnline, meetingLink, roomId, projectId, participantIds } = await c.req.json();

        const existingMeeting = await prisma.meeting.findUnique({
            where: { id },
            include: { participants: true }
        });

        if (!existingMeeting) return c.json({ message: 'Meeting not found' }, 404);

        if (existingMeeting.organizerId !== user.id && user.role !== 'ADMIN') {
            return c.json({ message: 'Only the organizer can update this meeting.' }, 403);
        }

        const start = startTime ? new Date(startTime) : existingMeeting.startTime;
        const end = endTime ? new Date(endTime) : existingMeeting.endTime;

        // Validate Room Availability
        const effectiveRoomId = roomId !== undefined ? roomId : existingMeeting.roomId;
        if (effectiveRoomId) {
            const overlap = await prisma.meeting.findFirst({
                where: {
                    id: { not: id },
                    roomId: effectiveRoomId,
                    status: 'SCHEDULED',
                    OR: [
                        { startTime: { lt: end }, endTime: { gt: start } }
                    ]
                }
            });

            if (overlap && user.role !== 'ADMIN') {
                return c.json({ message: 'Room is already booked for this time slot.' }, 400);
            }
        }

        const meeting = await prisma.meeting.update({
            where: { id },
            data: {
                title: title !== undefined ? title : existingMeeting.title,
                description: description !== undefined ? description : existingMeeting.description,
                startTime: start,
                endTime: end,
                isOnline: isOnline !== undefined ? isOnline : existingMeeting.isOnline,
                meetingLink: meetingLink !== undefined ? meetingLink : existingMeeting.meetingLink,
                roomId: roomId !== undefined ? (roomId || null) : existingMeeting.roomId,
                projectId: projectId !== undefined ? (projectId || null) : existingMeeting.projectId,
            },
            include: {
                participants: true
            }
        });

        if (participantIds) {
            await prisma.meetingParticipant.deleteMany({
                where: {
                    meetingId: id,
                    role: 'ATTENDEE'
                }
            });

            await prisma.meetingParticipant.createMany({
                data: participantIds
                    .filter(uid => uid !== existingMeeting.organizerId)
                    .map(uid => ({
                        meetingId: id,
                        userId: uid,
                        role: 'ATTENDEE',
                        status: 'PENDING'
                    }))
            });
        }

        // Sync with Google Calendar
        try {
            const dbUser = await prisma.user.findUnique({
                where: { id: user.id }
            });

            if (dbUser.googleAccessToken && dbUser.googleRefreshToken) {
                const roomInfo = meeting.roomId ? await prisma.meetingRoom.findUnique({ where: { id: meeting.roomId } }) : null;
                const meetingData = { ...meeting, room: roomInfo };

                if (meeting.googleEventId) {
                    await updateCalendarEvent(dbUser, meeting.googleEventId, meetingData);
                } else {
                    const googleEvent = await createCalendarEvent(dbUser, meetingData);
                    if (googleEvent && googleEvent.id) {
                        await prisma.meeting.update({
                            where: { id: meeting.id },
                            data: { googleEventId: googleEvent.id }
                        });
                    }
                }
            }
        } catch (syncError) {
            console.error('Failed to sync update with Google Calendar:', syncError);
        }

        return c.json(meeting);
    } catch (error) {
        return c.json({ message: 'Error updating meeting', error: error.message }, 500);
    }
};
