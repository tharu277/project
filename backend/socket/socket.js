const jwt = require('jsonwebtoken');
const Bus = require('../models/Bus');

module.exports = function initSocket(io, activeBuses = new Map()) {
  // 🔐 Socket Authentication Middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next();
    try {
      socket.user = jwt.verify(token, process.env.JWT_SECRET);
      next();
    } catch {
      next();
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 [Socket Connected] ID: ${socket.id} | Role: ${socket.user?.role || 'guest'}`);

    // 1. Connect වුණු Passenger කෙනෙක්ට දැනට Active සියලුම Buses යැවීම
    socket.emit('initial_active_buses', Array.from(activeBuses.values()));

    // 2. Driver Location Update Event එක
    socket.on('driver:update_location', async (data) => {
      try {
        const { busId, lat, lng, latitude, longitude, speed, heading, routeNumber } = data;
        const currentLat = Number(lat ?? latitude);
        const currentLng = Number(lng ?? longitude);
        const currentSpeed = Math.max(0, Number(speed) || 0);

        if (!busId || isNaN(currentLat) || isNaN(currentLng)) return;

        const updateData = {
          busId,
          routeNumber: routeNumber || 'N/A',
          lat: currentLat,
          lng: currentLng,
          speed: currentSpeed,
          heading: Number(heading) || 0,
          updatedAt: new Date().toISOString(),
          socketId: socket.id
        };

        // A. Memory (RAM Map) එක Update කිරීම
        activeBuses.set(busId, updateData);

        // B. Database (MongoDB) එක Async update කිරීම
        Bus.findByIdAndUpdate(busId, {
          currentLocation: { lat: currentLat, lng: currentLng },
          speed: currentSpeed,
          status: 'on-trip',
          lastUpdated: new Date()
        }).catch(err => console.error('[DB Update Error]:', err.message));

        // C. Frontend (Passengers) ලාට Broadcast කිරීම
        io.emit('bus:location_updated', updateData);
        io.emit('passenger_map_update', updateData); // Backup name for compatibility

      } catch (e) {
        console.error('[Socket Location Error]:', e.message);
      }
    });

    // 3. Driver Trip End Event එක
    socket.on('driver:end_trip', async ({ busId }) => {
      try {
        if (!busId) return;

        // RAM & DB Update
        activeBuses.delete(busId);
        await Bus.findByIdAndUpdate(busId, { status: 'inactive', speed: 0 });

        // Broadcast to clients
        io.emit('bus:trip_ended', { busId, timestamp: new Date().toISOString() });
        io.emit('bus_offline', busId);
      } catch (e) {
        console.error('[Socket End Trip Error]:', e.message);
      }
    });

    // 4. Disconnect Event එක Handling
    socket.on('disconnect', (reason) => {
      console.log(`❌ [Socket Disconnected] ${socket.id} — Reason: ${reason}`);

      // Auto cleanup: යම් හෙයකින් Driver disconnect වුණොත් Active map එකෙන් අයින් කිරීම
      for (let [busId, busData] of activeBuses.entries()) {
        if (busData.socketId === socket.id) {
          activeBuses.delete(busId);
          io.emit('bus_offline', busId);
          console.log(`🚌 Bus ${busId} marked offline due to disconnect.`);
          break;
        }
      }
    });

    socket.on('error', (err) => console.error('[Socket Error]:', err.message));
  });
};