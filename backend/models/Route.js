const mongoose = require('mongoose');

const stopSchema = new mongoose.Schema({
  name: String,
  lat:  Number,
  lng:  Number,
  order: Number
});

const routeSchema = new mongoose.Schema({
  routeNumber: { type: String, required: true, unique: true },
  origin:      { type: String, required: true },
  destination:  { type: String, required: true },
  stops:       [stopSchema],
  totalDistance: Number,
  estimatedTime: Number
}, { timestamps: true });

module.exports = mongoose.model('Route', routeSchema);