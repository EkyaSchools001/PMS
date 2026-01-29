const express = require('express');
const {
    createTask,
    getProjectTasks,
    updateTaskStatus,
} = require('../controllers/taskController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(authenticate);

// Create Task: Admin, Manager
router.post('/', authorize(['ADMIN', 'MANAGER']), createTask);

// Get Tasks: All users
router.get('/project/:projectId', getProjectTasks);

// Update Status: Admin, Manager, Employee (Assignee)
router.patch('/:id/status', updateTaskStatus);

module.exports = router;
