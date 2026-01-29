const express = require('express');
const {
    createProject,
    getProjects,
    getProjectById,
    updateProject,
    deleteProject,
} = require('../controllers/projectController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Create: Only Admin and Manager
router.post('/', authorize(['ADMIN', 'MANAGER']), createProject);

// Read: All authenticated users (filtered by role in controller)
router.get('/', getProjects);
router.get('/:id', getProjectById);

// Update/Delete: Only Admin and Manager
router.put('/:id', authorize(['ADMIN', 'MANAGER']), updateProject);
router.delete('/:id', authorize(['ADMIN', 'MANAGER']), deleteProject);

module.exports = router;
