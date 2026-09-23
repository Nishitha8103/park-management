const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const connectDB = require('./config/db');

// Connect to database
connectDB();

// Initialize SLA Cron Job
const { initSlaCron } = require('./cron/slaCron');
initSlaCron();

// Initialize Announcement Cron Job
const { initAnnouncementCron } = require('./cron/announcementCron');
initAnnouncementCron();

// Initialize Stall Payment Expiry Cron Job
const { initStallPaymentCron } = require('./cron/stallPaymentCron');
initStallPaymentCron();

// Initialize Inspection Reminder Cron Job
const { initInspectionCron } = require('./cron/inspectionCron');
initInspectionCron();

const compression = require('compression');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(compression());
app.use(express.json());

// Serve static files from uploads folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads/parks')));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/parks', require('./routes/parkRoutes'));
app.use('/api/master', require('./routes/masterDataRoutes'));
app.use('/api/announcements', require('./routes/announcementRoutes'));
app.use('/api/contractors', require('./routes/contractorRoutes'));
app.use('/api/complaints', require('./routes/complaintRoutes'));
app.use('/api/events', require('./routes/eventRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/stall-bookings', require('./routes/stallBookingRoutes'));
app.use('/api/stall-slots', require('./routes/stallSlotRoutes'));
app.use('/api/material-requests', require('./routes/materialRequestRoutes'));
app.use('/api/emergencies', require('./routes/emergencyRoutes'));
app.use('/api/reassignments', require('./routes/reassignmentRoutes'));
app.use('/api/leaves', require('./routes/leaveRoutes'));
app.use('/api/kyc', require('./routes/kycRoutes'));
app.use('/api/settings', require('./routes/settingRoutes'));
app.use('/api/feedback', require('./routes/feedbackRoutes'));


// Basic health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is running!' });
});

// Serve frontend in production or whenever dist exists
const fs = require('fs');
const distPath = path.join(__dirname, '../frontend/dist');
if (process.env.NODE_ENV === 'production' || (process.env.NODE_ENV !== 'development' && fs.existsSync(distPath))) {
  app.use(express.static(distPath));

  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.originalUrl.startsWith('/api') && !req.originalUrl.startsWith('/uploads')) {
      return res.sendFile(path.join(distPath, 'index.html'));
    }
    next();
  });
}

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err);
  res.status(500).json({ message: err.message || 'Internal Server Error' });
});

app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});
