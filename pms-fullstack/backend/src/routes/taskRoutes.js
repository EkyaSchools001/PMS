const express = require('express');
const {
    createTask,
    getProjectTasks,
    updateTaskStatus,
} = require('../controllers/taskController');
const { authenticate } = require('../middlewares/authMiddleware');
const { authorizeRole, validateProjectAccess, validateTaskAccess } = require('../middlewares/rbacMiddleware');
const { POLICIES } = require('../utils/policies');

const router = express.Router();

router.use(authenticate);

// Create Task: Admin, Manager (Must own project)
router.post('/', authorizeRole(POLICIES.TASKS.CREATE), validateProjectAccess, createTask);

// Get Tasks: Project members only
router.get('/project/:projectId', validateProjectAccess, getProjectTasks);

// Update Status: Role check + Task membership check
router.patch('/:id/status', authorizeRole(POLICIES.TASKS.UPDATE), validateTaskAccess, updateTaskStatus);

module.exports = router;
