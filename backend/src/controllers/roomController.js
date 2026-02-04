import prisma from '../utils/prisma.js';

/**
 * @desc    Get all meeting rooms
 */
export const getRooms = async (c) => {
    try {
        const rooms = await prisma.meetingRoom.findMany({
            include: {
                availability: true,
                blockedSlots: true
            }
        });
        return c.json(rooms);
    } catch (error) {
        return c.json({ message: 'Error fetching rooms', error: error.message }, 500);
    }
};

/**
 * @desc    Create a meeting room
 */
export const createRoom = async (c) => {
    try {
        const { name, capacity, location } = await c.req.json();
        const room = await prisma.meetingRoom.create({
            data: { name, capacity: parseInt(capacity), location }
        });
        return c.json(room, 201);
    } catch (error) {
        return c.json({ message: 'Error creating room', error: error.message }, 500);
    }
};

/**
 * @desc    Update a meeting room
 */
export const updateRoom = async (c) => {
    try {
        const { id } = c.req.param();
        const { name, capacity, location, isActive } = await c.req.json();
        const room = await prisma.meetingRoom.update({
            where: { id },
            data: {
                name,
                capacity: capacity ? parseInt(capacity) : undefined,
                location,
                isActive
            }
        });
        return c.json(room);
    } catch (error) {
        return c.json({ message: 'Error updating room', error: error.message }, 500);
    }
};

/**
 * @desc    Add availability slot to room
 */
export const addAvailability = async (c) => {
    try {
        const { id } = c.req.param();
        const { dayOfWeek, startTime, endTime } = await c.req.json();
        const slot = await prisma.roomAvailabilitySlot.create({
            data: {
                roomId: id,
                dayOfWeek: parseInt(dayOfWeek),
                startTime,
                endTime
            }
        });
        return c.json(slot, 201);
    } catch (error) {
        return c.json({ message: 'Error adding availability', error: error.message }, 500);
    }
};

/**
 * @desc    Block room for maintenance or event
 */
export const blockRoom = async (c) => {
    try {
        const { id } = c.req.param();
        const { startTime, endTime, reason } = await c.req.json();
        const slot = await prisma.roomBlockedSlot.create({
            data: {
                roomId: id,
                startTime: new Date(startTime),
                endTime: new Date(endTime),
                reason
            }
        });
        return c.json(slot, 201);
    } catch (error) {
        return c.json({ message: 'Error blocking room', error: error.message }, 500);
    }
};
