import { Hono } from 'hono';
import {
    createTask,
    getProjectTasks,
    updateTaskStatus,
    updateTask,
    getMyTasks,
} from '../../controllers/taskController.js';
import { authenticate } from '../../middlewares/honoAuth.js';
import { authorizeRole, validateProjectAccess, validateTaskAccess } from '../../middlewares/honoRbac.js';
import { POLICIES, ROLES } from '../../utils/policies.js';

export const taskRoutes = new Hono();

// All routes require authentication
taskRoutes.use('*', authenticate);

// Create Task: Admin, Manager (Must own project)
taskRoutes.post('/', authorizeRole(POLICIES.TASKS.CREATE), validateProjectAccess, createTask);

// Update Task: Admin/Manager only
taskRoutes.put('/:id', authorizeRole([ROLES.ADMIN, ROLES.MANAGER]), validateTaskAccess, updateTask);

// Get current user's tasks
taskRoutes.get('/my-tasks', getMyTasks);

// Get Tasks: Project members only
taskRoutes.get('/project/:projectId', validateProjectAccess, getProjectTasks);

// Update Status: Role check + Task membership check
taskRoutes.patch('/:id/status', authorizeRole(POLICIES.TASKS.UPDATE), validateTaskAccess, updateTaskStatus);
