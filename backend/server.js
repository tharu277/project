const express       = require('express');
const mongoose      = require('mongoose');
const cors          = require('cors');
const http          = require('http');
const helmet        = require('helmet');
const rateLimit     = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const { Server }    = require('socket.io');
require('dotenv').config();

const authRoutes     = require('./routes/auth');
const busRoutes      = require('./routes/bus');
const routeRoutes    = require('./routes/route');
const locationRoutes = require('./routes/location');
const initSocket     = require('./socket/socket');

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, {
  cors: { origin: process.env.CLIENT_URL || 'http://localhost:3000', methods: ['GET','POST'], credentials: true },
  pingTimeout: 60000,
  pingInterval: 25000,
});

// ── Security ─────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000', credentials: true, methods: ['GET','POST','PUT','DELETE','OPTIONS'] }));
app.use(rateLimit({ windowMs: 15*60*1000, max: 300, message: { success: false, message: 'Too many requests. Try again later.' } }));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(mongoSanitize());

// ── Logger ───────────────────────────────────────────────────
app.use((req, res, next) => {
  if (process.env.NODE_ENV !== 'production')
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// ── Auth rate limiter ─────────────────────────────────────────
const authLimiter = rateLimit({ windowMs: 15*60*1000, max: 20, message: { success:false, message:'Too many login attempts. Wait 15 minutes.' } });

// ── Routes ───────────────────────────────────────────────────
app.use('/api/auth',     authLimiter, authRoutes);
app.use('/api/buses',    busRoutes);
app.use('/api/routes',   routeRoutes);
app.use('/api/location', locationRoutes);

// ── Health check ─────────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ success:true, message:'Smart Bus API running', uptime: Math.floor(process.uptime())+'s', timestamp: new Date().toISOString() }));
app.get('/', (req, res) => res.json({ success:true, message:'Smart Bus Tracking API running!' }));

// ── 404 + Error handlers ─────────────────────────────────────
app.use('*', (req, res) => res.status(404).json({ success:false, message:`Route ${req.originalUrl} not found` }));
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.message);
  res.status(err.statusCode||500).json({ success:false, message: process.env.NODE_ENV==='production' ? 'Something went wrong.' : err.message });
});

initSocket(io);

// ── Start ────────────────────────────────────────────────────
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/busdb', { serverSelectionTimeoutMS:10000 })
  .then(() => {
    console.log('✅ MongoDB connected');
    server.listen(process.env.PORT||5000, () => console.log(`🚀 Server running on port ${process.env.PORT||5000}`));
  })
  .catch(err => { console.error('❌ MongoDB failed:', err.message); process.exit(1); });

process.on('SIGTERM', () => server.close(() => mongoose.connection.close(false, () => process.exit(0))));
