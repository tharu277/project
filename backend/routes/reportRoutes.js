const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit-table');
const Bus = require('../models/Bus'); // ඔයාගේ Bus Model එක

// 📄 Bus Trip Report එක PDF එකක් ලෙස Download කරගැනීමේ API එක
router.get('/generate-bus-report', async (req, res) => {
  try {
    // 1. Database එකෙන් Buses Data ලබා ගැනීම
    const buses = await Bus.find({}).lean();

    // 2. PDF Document එකක් සාදාගැනීම
    const doc = new PDFDocument({ margin: 30, size: 'A4' });

    // Header / Content-Type හරියාකාරව Pipe කිරීම (Browser එකට PDF එකක් ලෙස යැවීමට)
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=Bus_System_Report.pdf');

    doc.pipe(res);

    // 3. Report Header එක එකතු කිරීම
    doc.fontSize(20).text('🚌 Smart Bus Tracking System', { align: 'center' });
    doc.fontSize(14).text('Daily Bus Activity & Status Report', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(10).text(`Generated Date: ${new Date().toLocaleString()}`, { align: 'right' });
    doc.moveDown(1.5);

    // 4. Data Table එක සකස් කිරීම
    const table = {
      title: "Active & Inactive Buses Overview",
      headers: [
        { label: "Bus ID", property: "busId", width: 80 },
        { label: "Route Number", property: "routeNumber", width: 90 },
        { label: "Status", property: "status", width: 80 },
        { label: "Speed (km/h)", property: "speed", width: 80 },
        { label: "Last Location", property: "location", width: 150 }
      ],
      rows: buses.map(bus => [
        bus.busId || 'N/A',
        bus.routeNumber || 'N/A',
        bus.status || 'inactive',
        `${bus.speed || 0} km/h`,
        bus.currentLocation ? `${bus.currentLocation.lat.toFixed(4)}, ${bus.currentLocation.lng.toFixed(4)}` : 'Unknown'
      ])
    };

    // Table එක PDF එකට එකතු කිරීම
    await doc.table(table, {
      prepareHeader: () => doc.font("Helvetica-Bold").fontSize(10),
      prepareRow: (row, index, column, rect, rowHeight) => doc.font("Helvetica").fontSize(9),
    });

    // 5. PDF එක Close කිරීම
    doc.end();

  } catch (error) {
    console.error('Report Error:', error);
    res.status(500).json({ message: 'Error generating PDF report' });
  }
});

module.exports = router;