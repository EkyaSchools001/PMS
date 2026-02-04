import { Hono } from 'hono';
import {
    createProject,
    getProjects,
    getProjectById,
    updateProject,
    deleteProject,
    addMember,
    removeMember
} from '../../controllers/projectController.js';
import { authenticate } from '../../middlewares/honoAuth.js';
import { authorizeRole, validateProjectAccess } from '../../middlewares/honoRbac.js';
import { POLICIES } from '../../utils/policies.js';

export const projectRoutes = new Hono();

// All routes require authentication
projectRoutes.use('*', authenticate);

// Create: Roles defined in policy
projectRoutes.post('/', authorizeRole(POLICIES.PROJECTS.CREATE), createProject);

// Read: All authenticated users (getProjects filters list, getProjectById needs ownership check)
projectRoutes.get('/', getProjects);
projectRoutes.get('/:id', validateProjectAccess, getProjectById);

// Update/Delete: Role check + Ownership check
projectRoutes.put('/:id', authorizeRole(POLICIES.PROJECTS.UPDATE), validateProjectAccess, updateProject);
projectRoutes.delete('/:id', authorizeRole(POLICIES.PROJECTS.DELETE), validateProjectAccess, deleteProject);

// Team Management: Only Admin and Manager (Manager must own project)
projectRoutes.post('/:id/members', authorizeRole(POLICIES.PROJECTS.UPDATE), validateProjectAccess, addMember);
projectRoutes.delete('/:id/members', authorizeRole(POLICIES.PROJECTS.UPDATE), validateProjectAccess, removeMember);
