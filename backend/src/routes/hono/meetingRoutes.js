import { Hono } from 'hono';
import * as meetingController from '../../controllers/meetingController.js';
import { authenticate } from '../../middlewares/honoAuth.js';

export const meetingRoutes = new Hono();

// All routes require authentication
meetingRoutes.use('*', authenticate);

meetingRoutes.get('/', meetingController.getMeetings);
meetingRoutes.post('/', meetingController.scheduleMeeting);
meetingRoutes.post('/:id/rsvp', meetingController.rsvpMeeting);
meetingRoutes.put('/:id', meetingController.updateMeeting);
meetingRoutes.delete('/:id', meetingController.cancelMeeting);
