const mongoose = require('mongoose');

const timetableSchema = new mongoose.Schema({
  busNumber: {
    type: String,
    required: true,
    trim: true
  },
  routeNumber: {
    type: String,
    required: true,
    trim: true
  },
  stops: [
    {
      stopName: {
        type: String,
        required: true
      },
      arrivalTime: {
        type: String,
        required: true
      }
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model('Timetable', timetableSchema);