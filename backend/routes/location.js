
const router = require('express').Router();
const Bus    = require('../models/Bus');
const { protect, restrictTo } = require('../middleware/auth');

router.get('/active', async (req, res) => {
  try {
    const buses = await Bus.find({ status:'on-trip', isActive:true })
      .select('busNumber currentLocation speed status lastUpdated routeId driverId')
      .populate('routeId','routeNumber origin destination stops')
      .populate('driverId','name').lean();
    res.json({ success:true, count:buses.length, data:buses });
  } catch(e) { res.status(500).json({ success:false, message:e.message }); }
});

router.post('/update', protect, restrictTo('driver','admin'), async (req, res) => {
  try {
    const { busId, lat, lng, speed } = req.body;
    if (!busId) return res.status(400).json({ success:false, message:'Bus ID is required.' });
    if (lat===undefined||lng===undefined) return res.status(400).json({ success:false, message:'Lat and lng required.' });
    const bus = await Bus.findByIdAndUpdate(busId, {
      currentLocation: { lat:Number(lat), lng:Number(lng) },
      speed:  Math.max(0, Number(speed)||0),
      status: 'on-trip',
      lastUpdated: new Date(),
    }, { new:true });
    if (!bus) return res.status(404).json({ success:false, message:'Bus not found.' });
    res.json({ success:true, message:'Location updated.', data:{ busId, lat, lng, speed } });
  } catch(e) { res.status(500).json({ success:false, message:e.message }); }
});

module.exports = router;


