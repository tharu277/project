
const router   = require('express').Router();
const mongoose = require('mongoose');
const Route    = require('../models/Route');
const { protect, restrictTo } = require('../middleware/auth');

const isValidId = id => id && mongoose.Types.ObjectId.isValid(id);

router.get('/', async (req, res) => {
  try {
    const routes = await Route.find({ isActive:true }).sort({ routeNumber:1 }).lean();
    res.json({ success:true, count:routes.length, data:routes });
  } catch(e) { res.status(500).json({ success:false, message:e.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ success:false, message:'Invalid route ID.' });
    const route = await Route.findById(req.params.id).lean();
    if (!route) return res.status(404).json({ success:false, message:'Route not found.' });
    res.json({ success:true, data:route });
  } catch(e) { res.status(500).json({ success:false, message:e.message }); }
});

router.post('/', protect, restrictTo('admin'), async (req, res) => {
  try {
    const { routeNumber, origin, destination, stops, totalDistance, estimatedTime } = req.body;
    if (!routeNumber||!origin||!destination) return res.status(400).json({ success:false, message:'Route number, origin and destination are required.' });
    const exists = await Route.findOne({ routeNumber });
    if (exists) return res.status(400).json({ success:false, message:`Route ${routeNumber} already exists.` });
    const route = await Route.create({ routeNumber, origin, destination, stops:stops||[], totalDistance:totalDistance||0, estimatedTime:estimatedTime||0 });
    res.status(201).json({ success:true, data:route });
  } catch(e) {
    if (e.name==='ValidationError') return res.status(400).json({ success:false, message:Object.values(e.errors)[0].message });
    res.status(500).json({ success:false, message:e.message });
  }
});

router.put('/:id', protect, restrictTo('admin'), async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ success:false, message:'Invalid route ID.' });
    const route = await Route.findByIdAndUpdate(req.params.id, req.body, { new:true, runValidators:true });
    if (!route) return res.status(404).json({ success:false, message:'Route not found.' });
    res.json({ success:true, data:route });
  } catch(e) { res.status(500).json({ success:false, message:e.message }); }
});

router.delete('/:id', protect, restrictTo('admin'), async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ success:false, message:'Invalid route ID.' });
    const route = await Route.findById(req.params.id);
    if (!route) return res.status(404).json({ success:false, message:'Route not found.' });
    await Route.findByIdAndUpdate(req.params.id, { isActive:false });
    res.json({ success:true, message:`Route ${route.routeNumber} deleted.` });
  } catch(e) { res.status(500).json({ success:false, message:e.message }); }
});

module.exports = router;


