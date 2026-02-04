import { Hono } from 'hono';
import * as roomController from '../../controllers/roomController.js';
import { authenticate, authorize } from '../../middlewares/honoAuth.js';

export const roomRoutes = new Hono();

// All routes require authentication
roomRoutes.use('*', authenticate);

roomRoutes.get('/', roomController.getRooms);
roomRoutes.post('/', authorize(['ADMIN']), roomController.createRoom);
roomRoutes.put('/:id', authorize(['ADMIN']), roomController.updateRoom);
roomRoutes.post('/:id/availability', authorize(['ADMIN']), roomController.addAvailability);
roomRoutes.post('/:id/block', authorize(['ADMIN']), roomController.blockRoom);
