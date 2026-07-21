const mongoose = require('mongoose');

const busSchema = new mongoose.Schema({
  busNumber:   { type: String, required: true, unique: true },
  driverId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  routeId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Route' },
  status:      { type: String, enum: ['active','inactive','on-trip'], default: 'inactive' },
  currentLocation: {
    lat: { type: Number },
    lng: { type: Number }
  },
  speed:       { type: Number, default: 0 },
  lastUpdated: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Bus', busSchema);