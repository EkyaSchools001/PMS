import { Hono } from 'hono';
import * as ticketController from '../../controllers/ticketController.js';
import { authenticate } from '../../middlewares/honoAuth.js';

export const ticketRoutes = new Hono();

// All routes require authentication
ticketRoutes.use('*', authenticate);

ticketRoutes.post('/', ticketController.createTicket);
ticketRoutes.get('/', ticketController.getTickets);
ticketRoutes.get('/recent', ticketController.getRecentTickets);
ticketRoutes.get('/:id/status', ticketController.getTicketStatus);
ticketRoutes.get('/:id/logs', ticketController.getTicketLogs);
ticketRoutes.put('/:id', ticketController.updateTicket);
ticketRoutes.post('/:id/comments', ticketController.addTicketComment);
