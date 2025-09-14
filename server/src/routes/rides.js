const express = require('express');
const Ride = require('../models/Ride');
const { authRequired } = require('../middleware/auth');

const router = express.Router();

// Search rides
router.get('/', async (req, res) => {
  try {
    const { from, to, date } = req.query;
    const query = {};
    if (from) query.from = new RegExp(`^${from}`, 'i');
    if (to) query.to = new RegExp(`^${to}`, 'i');
    if (date) {
      const d = new Date(date);
      if (!isNaN(d)) {
        const start = new Date(d.setHours(0, 0, 0, 0));
        const end = new Date(d.setHours(23, 59, 59, 999));
        query.date = { $gte: start, $lte: end };
      }
    }
    const rides = await Ride.find(query).populate('driver', 'name email photo');
    res.json(rides);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch rides' });
  }
});

// Create a ride (requires auth)
router.post('/', authRequired, async (req, res) => {
  try {
    const { from, to, date, seats, price, notes } = req.body;
    if (!from || !to || !date || !seats || price == null) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const ride = await Ride.create({
      driver: req.user.id,
      from,
      to,
      date,
      seats,
      price,
      notes,
    });
    const populated = await ride.populate('driver', 'name email photo');
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create ride' });
  }
});

module.exports = router;

