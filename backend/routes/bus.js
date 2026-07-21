const router   = require('express').Router();
const mongoose = require('mongoose');
const Bus      = require('../models/Bus');
const { protect, restrictTo } = require('../middleware/auth');

const isValidId = id => id && mongoose.Types.ObjectId.isValid(id);

// GET all buses
router.get('/', async (req, res) => {
  try {
    const buses = await Bus.find({ isActive:true })
      .populate('routeId','routeNumber origin destination estimatedTime')
      .populate('driverId','name email')
      .sort({ createdAt:-1 }).lean();
    res.json({ success:true, count:buses.length, data:buses });
  } catch(e) { res.status(500).json({ success:false, message:e.message }); }
});

// GET search
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json({ success:true, count:0, data:[] });
    const buses = await Bus.find({ isActive:true, busNumber:{ $regex:q, $options:'i' } })
      .populate('routeId','routeNumber origin destination').lean();
    res.json({ success:true, count:buses.length, data:buses });
  } catch(e) { res.status(500).json({ success:false, message:e.message }); }
});

// GET single bus
router.get('/:id', async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ success:false, message:'Invalid bus ID.' });
    const bus = await Bus.findById(req.params.id).populate('routeId').populate('driverId','name').lean();
    if (!bus) return res.status(404).json({ success:false, message:'Bus not found.' });
    res.json({ success:true, data:bus });
  } catch(e) { res.status(500).json({ success:false, message:e.message }); }
});

// POST add bus (admin)
router.post('/', protect, restrictTo('admin'), async (req, res) => {
  try {
    const { busNumber, routeId, driverId, status, capacity } = req.body;
    if (!busNumber) return res.status(400).json({ success:false, message:'Bus number is required.' });
    const exists = await Bus.findOne({ busNumber:busNumber.toUpperCase() });
    if (exists) return res.status(400).json({ success:false, message:`Bus ${busNumber} already exists.` });
    const bus = await Bus.create({ busNumber, routeId:routeId||null, driverId:driverId||null, status:status||'inactive', capacity:capacity||50 });
    await bus.populate('routeId','routeNumber origin destination');
    res.status(201).json({ success:true, data:bus });
  } catch(e) {
    if (e.name==='ValidationError') return res.status(400).json({ success:false, message:Object.values(e.errors)[0].message });
    res.status(500).json({ success:false, message:e.message });
  }
});

// PUT update bus
router.put('/:id', protect, async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ success:false, message:'Invalid bus ID.' });
    // Drivers can only update location/speed/status
    if (req.user.role==='driver') {
      const allowed = ['status','currentLocation','speed','lastUpdated'];
      Object.keys(req.body).forEach(k => { if (!allowed.includes(k)) delete req.body[k]; });
    }
    const bus = await Bus.findByIdAndUpdate(req.params.id, req.body, { new:true, runValidators:true })
      .populate('routeId','routeNumber origin destination').populate('driverId','name');
    if (!bus) return res.status(404).json({ success:false, message:'Bus not found.' });
    res.json({ success:true, data:bus });
  } catch(e) { res.status(500).json({ success:false, message:e.message }); }
});

// DELETE bus (admin) — soft delete
router.delete('/:id', protect, restrictTo('admin'), async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ success:false, message:'Invalid bus ID.' });
    const bus = await Bus.findById(req.params.id);
    if (!bus) return res.status(404).json({ success:false, message:'Bus not found.' });
    await Bus.findByIdAndUpdate(req.params.id, { isActive:false });
    res.json({ success:true, message:`Bus ${bus.busNumber} deleted.` });
  } catch(e) { res.status(500).json({ success:false, message:e.message }); }
});

module.exports = router;


