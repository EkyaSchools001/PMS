const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/authRoutes');
const projectRoutes = require('./routes/projectRoutes');
const taskRoutes = require('./routes/taskRoutes');
const usersRoutes = require('./routes/users');
const chatRoutes = require('./routes/chatRoutes');
const meetingRoutes = require('./routes/meetingRoutes');
const roomRoutes = require('./routes/roomRoutes');
const calendarRoutes = require('./routes/calendarRoutes');

dotenv.config();

const app = express();

const path = require('path');

// Middleware
app.use(cors());
app.use(express.json());

// Serve uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/projects', projectRoutes);
app.use('/api/v1/tasks', taskRoutes);
app.use('/api/v1/users', usersRoutes);
app.use('/api/v1/chats', chatRoutes);
app.use('/api/v1/meetings', meetingRoutes);
app.use('/api/v1/rooms', roomRoutes);
app.use('/api/v1/calendar', calendarRoutes);

app.get('/', (req, res) => {
    res.send('Project Management System API is running...');
});

// Error Handling Middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Server Error', error: err.message });
});

module.exports = app;
