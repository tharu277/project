
const jwt = require('jsonwebtoken');
const Bus = require('../models/Bus');

module.exports = function initSocket(io) {
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next();
    try { socket.user = jwt.verify(token, process.env.JWT_SECRET); next(); }
    catch { next(); }
  });

  io.on('connection', (socket) => {
    console.log(`[Socket] ${socket.id} [${socket.user?.role||'guest'}]`);

    socket.on('driver:update_location', async ({ busId, lat, lng, speed }) => {
      try {
        if (!socket.user || socket.user.role !== 'driver') return;
        if (!busId || lat===undefined || lng===undefined) return;
        await Bus.findByIdAndUpdate(busId, {
          currentLocation: { lat:Number(lat), lng:Number(lng) },
          speed: Math.max(0, Number(speed)||0),
          status: 'on-trip',
          lastUpdated: new Date(),
        });
        io.emit('bus:location_updated', { busId, lat:Number(lat), lng:Number(lng), speed:Math.max(0,Number(speed)||0), timestamp: new Date().toISOString() });
      } catch(e) { console.error('[Socket] location error:', e.message); }
    });

    socket.on('driver:end_trip', async ({ busId }) => {
      try {
        if (!socket.user || socket.user.role !== 'driver' || !busId) return;
        await Bus.findByIdAndUpdate(busId, { status:'inactive', speed:0 });
        io.emit('bus:trip_ended', { busId, timestamp: new Date().toISOString() });
      } catch(e) { console.error('[Socket] end trip error:', e.message); }
    });

    socket.on('disconnect', reason => console.log(`[Socket] Disconnected: ${socket.id} — ${reason}`));
    socket.on('error', err => console.error('[Socket] Error:', err.message));
  });
};
