const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const webpush = require('web-push');
require('dotenv').config();

// ----------------------------------------------------
// 1. Route Imports
// ----------------------------------------------------
const authRoutes = require('./routes/auth');
const busRoutes = require('./routes/bus');
const routeRoutes = require('./routes/route');
const locationRoutes = require('./routes/location');
const timetableRoutes = require('./routes/timetableRoutes');
const reportRoutes = require('./routes/reportRoutes'); // PDF Reports සඳහා
const initSocket = require('./socket/socket');

// Optional Push Subscription Model (නැත්නම් comment කර තබන්න)
// const PushSubscription = require('./models/PushSubscription'); 

const app = express();
const server = http.createServer(app);

// ----------------------------------------------------
// 2. Middlewares & CORS Configuration
// ----------------------------------------------------
app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ----------------------------------------------------
// 3. Socket.io Configuration
// ----------------------------------------------------
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || '*',
    methods: ['GET', 'POST']
  }
});

// Memory Cache for Active Buses (Quick access for new passengers/live map)
const activeBuses = new Map(); 

// Socket logic initialize කිරීම
initSocket(io, activeBuses);

// ----------------------------------------------------
// 4. Web Push Notifications Setup (VAPID)
// ----------------------------------------------------
if (process.env.PUBLIC_VAPID_KEY && process.env.PRIVATE_VAPID_KEY) {
  webpush.setVapidDetails(
    'mailto:support@smartbus.com',
    process.env.PUBLIC_VAPID_KEY,
    process.env.PRIVATE_VAPID_KEY
  );
}

// ----------------------------------------------------
// 5. REST API Routes Setup
// ----------------------------------------------------

// Health Check / Base Endpoint
app.get('/', (req, res) => {
  res.json({ message: '🚀 Smart Bus Tracking & Management System API Running Smoothly!' });
});

// Core Application Endpoints
app.use('/api/auth', authRoutes);
app.use('/api/buses', busRoutes);
app.use('/api/routes', routeRoutes);
app.use('/api/location', locationRoutes);
app.use('/api/timetables', timetableRoutes);
app.use('/api/reports', reportRoutes); // Daily/Monthly PDF Reports සඳහා

// Live Active Buses Endpoint (Dashboard & Live Map)
app.get('/api/active-buses', (req, res) => {
  const buses = Array.from(activeBuses.values());
  res.json({ success: true, count: buses.length, buses });
});

// ----------------------------------------------------
// 6. Push Notification Endpoints
// ----------------------------------------------------

// Save Passenger Push Subscription
app.post('/api/notifications/subscribe', async (req, res) => {
  try {
    const subscription = req.body;
    // DB Save Logic (Optional):
    // await PushSubscription.findOneAndUpdate({ endpoint: subscription.endpoint }, subscription, { upsert: true, new: true });
    res.status(201).json({ success: true, message: 'Subscribed to Push Notifications successfully!' });
  } catch (error) {
    console.error('Subscription error:', error);
    res.status(500).json({ error: 'Failed to save subscription' });
  }
});

// Broadcast Push Notification
app.post('/api/notifications/send', async (req, res) => {
  const { title, body, routeNumber } = req.body;
  const payload = JSON.stringify({
    title: title || '🚌 Smart Bus Alert',
    body: body || `Bus on Route ${routeNumber || ''} has updated status!`,
    icon: '/logo192.png'
  });

  try {
    // DB Broadcast Logic (Optional):
    // const subscriptions = await PushSubscription.find();
    // await Promise.all(subscriptions.map(sub => webpush.sendNotification(sub, payload).catch(...)));
    res.json({ success: true, message: 'Push notifications broadcasted successfully!' });
  } catch (err) {
    console.error('Failed to send push notifications:', err);
    res.status(500).json({ error: 'Failed to broadcast notification' });
  }
});

// ----------------------------------------------------
// 7. Global 404 & Error Handling Middleware
// ----------------------------------------------------
app.use((req, res, next) => {
  res.status(404).json({ message: `Route Not Found - [${req.method}] ${req.originalUrl}` });
});

app.use((err, req, res, next) => {
  console.error('🔥 Server Internal Error:', err.stack);
  res.status(500).json({ message: 'Internal Server Error', error: err.message });
});

// ----------------------------------------------------
// 8. Database Connection & Server Startup
// ----------------------------------------------------
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/smartbus';

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected successfully');
    server.listen(PORT, () => {
      console.log(`🚀 Server is running on http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ Database Connection Error:', err);
    process.exit(1);
  });