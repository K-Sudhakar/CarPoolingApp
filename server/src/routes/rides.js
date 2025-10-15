const express = require('express');
const Ride = require('../models/Ride');
const { authRequired, optionalAuth } = require('../middleware/auth');
const Message = require('../models/Message');
const { notifySeatRequestStatusChange } = require('../services/notifications');

const router = express.Router();

const ACTIVE_REQUEST_STATUSES = new Set(['pending', 'approved']);

function getDocumentId(value) {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (value._id) return value._id.toString();
  if (typeof value.toString === 'function') return value.toString();
  return null;
}

function calculateReservedSeats(ride) {
  if (!ride || !Array.isArray(ride.requests)) {
    return 0;
  }
  return ride.requests.reduce((total, request) => {
    if (request && ACTIVE_REQUEST_STATUSES.has(request.status)) {
      return total + (request.seats || 0);
    }
    return total;
  }, 0);
}

function computeRemainingSeats(ride) {
  const remaining = (ride && ride.seats ? ride.seats : 0) - calculateReservedSeats(ride);
  return remaining > 0 ? remaining : 0;
}

function formatRequest(request) {
  if (!request) return null;
  const id = getDocumentId(request._id || request.id);
  const passengerId = getDocumentId(request.passenger);
  let passenger = null;
  if (request.passenger && request.passenger._id) {
    passenger = {
      id: passengerId,
      name: request.passenger.name,
      email: request.passenger.email,
      photo: request.passenger.photo,
    };
  }
  return {
    id,
    passengerId,
    seats: request.seats,
    message: request.message,
    status: request.status,
    createdAt: request.createdAt,
    passenger,
  };
}

function formatRideSummary(rideDoc, currentUserId = null) {
  const ride = rideDoc.toJSON();
  ride.remainingSeats = computeRemainingSeats(rideDoc);

  if (currentUserId) {
    const myRequestDoc = Array.isArray(rideDoc.requests)
      ? rideDoc.requests.find((request) => getDocumentId(request.passenger) === currentUserId)
      : null;

    if (myRequestDoc) {
      ride.myRequest = {
        id: getDocumentId(myRequestDoc._id || myRequestDoc.id),
        seats: myRequestDoc.seats,
        status: myRequestDoc.status,
        message: myRequestDoc.message,
        createdAt: myRequestDoc.createdAt,
      };
    }
  }

  delete ride.requests;
  delete ride.__v;

  return ride;
}

function formatRideForDriver(rideDoc) {
  const ride = rideDoc.toJSON();
  ride.remainingSeats = computeRemainingSeats(rideDoc);
  ride.requests = rideDoc.requests.map((request) => formatRequest(request));
  delete ride.__v;
  return ride;
}

function extractRideParticipantIds(rideDoc) {
  const driverId = getDocumentId(rideDoc.driver);
  const passengerIds = Array.isArray(rideDoc.requests)
    ? rideDoc.requests
        .map((request) => getDocumentId(request.passenger))
        .filter((id) => !!id)
    : [];
  return { driverId, passengerIds };
}

function userCanAccessRideMessages(rideDoc, userId) {
  if (!userId) return false;
  const { driverId, passengerIds } = extractRideParticipantIds(rideDoc);
  if (driverId && driverId === userId) {
    return true;
  }
  return passengerIds.includes(userId);
}

function formatMessage(messageDoc, currentUserId = null) {
  if (!messageDoc) return null;
  const id = getDocumentId(messageDoc._id || messageDoc.id);
  const rideId = getDocumentId(messageDoc.ride);
  const senderId = getDocumentId(messageDoc.sender);
  let sender = null;
  if (messageDoc.sender && messageDoc.sender._id) {
    sender = {
      id: senderId,
      name: messageDoc.sender.name,
      email: messageDoc.sender.email,
      photo: messageDoc.sender.photo,
    };
  }
  return {
    id,
    rideId,
    senderId,
    body: messageDoc.body,
    createdAt: messageDoc.createdAt,
    sender,
    isMine: currentUserId ? senderId === currentUserId : false,
  };
}

// Search rides
router.get('/', optionalAuth, async (req, res) => {
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
    const currentUserId = req.user?.id || null;
    const payload = rides.map((ride) => formatRideSummary(ride, currentUserId));
    res.json(payload);
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
    const response = formatRideSummary(populated, req.user?.id || null);
    res.status(201).json(response);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create ride' });
  }
});

// Fetch rides created by the authenticated driver
router.get('/mine', authRequired, async (req, res) => {
  try {
    const rides = await Ride.find({ driver: req.user.id })
      .sort({ date: 1 })
      .populate('driver', 'name email photo')
      .populate('requests.passenger', 'name email photo');

    const payload = rides.map((ride) => formatRideForDriver(ride));
    res.json(payload);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch your rides' });
  }
});

// Request a seat on a ride (requires auth)
router.post('/:id/requests', authRequired, async (req, res) => {
  try {
    const { seats: seatsRaw = 1, message: rawMessage } = req.body || {};
    const seatsRequested = Number.parseInt(seatsRaw, 10);
    if (Number.isNaN(seatsRequested) || seatsRequested < 1) {
      return res.status(400).json({ error: 'Seats must be a positive integer' });
    }

    const message = typeof rawMessage === 'string' ? rawMessage.trim() : '';
    if (message.length > 500) {
      return res.status(400).json({ error: 'Message is too long' });
    }

    const ride = await Ride.findById(req.params.id).populate('driver', 'name email photo');
    if (!ride) {
      return res.status(404).json({ error: 'Ride not found' });
    }

    const driverId = getDocumentId(ride.driver);
    if (driverId && driverId === req.user.id) {
      return res.status(400).json({ error: 'You cannot request your own ride' });
    }

    const duplicate = ride.requests.some(
      (r) => getDocumentId(r.passenger) === req.user.id && r.status === 'pending'
    );
    if (duplicate) {
      return res.status(409).json({ error: 'You already have a pending request for this ride' });
    }

    const reservedSeats = calculateReservedSeats(ride);
    if (reservedSeats + seatsRequested > ride.seats) {
      return res.status(400).json({ error: 'Not enough seats remaining' });
    }

    const requestPayload = { passenger: req.user.id, seats: seatsRequested };
    if (message) {
      requestPayload.message = message;
    }

    ride.requests.push(requestPayload);
    await ride.save();

    const newRequest = ride.requests[ride.requests.length - 1];

    res.status(201).json({
      rideId: ride.id,
      remainingSeats: computeRemainingSeats(ride),
      request: formatRequest(newRequest),
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to request seat' });
  }
});

// Fetch ride conversation messages
router.get('/:id/messages', authRequired, async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id)
      .populate('driver', 'name email photo')
      .populate('requests.passenger', 'name email photo');

    if (!ride) {
      return res.status(404).json({ error: 'Ride not found' });
    }

    if (!userCanAccessRideMessages(ride, req.user.id)) {
      return res
        .status(403)
        .json({ error: 'You are not allowed to view messages for this ride' });
    }

    const messages = await Message.find({ ride: ride.id })
      .sort({ createdAt: 1 })
      .populate('sender', 'name email photo');

    const payload = messages.map((message) => formatMessage(message, req.user.id));
    res.json(payload);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load ride messages' });
  }
});

// Post a message to the ride conversation
router.post('/:id/messages', authRequired, async (req, res) => {
  try {
    const { message: rawMessage, body: rawBody } = req.body || {};
    const contentSource = typeof rawMessage === 'string' ? rawMessage : rawBody;
    const messageBody = typeof contentSource === 'string' ? contentSource.trim() : '';

    if (!messageBody) {
      return res.status(400).json({ error: 'Message body is required' });
    }

    if (messageBody.length > 1000) {
      return res.status(400).json({ error: 'Message is too long' });
    }

    const ride = await Ride.findById(req.params.id)
      .populate('driver', 'name email photo')
      .populate('requests.passenger', 'name email photo');

    if (!ride) {
      return res.status(404).json({ error: 'Ride not found' });
    }

    if (!userCanAccessRideMessages(ride, req.user.id)) {
      return res
        .status(403)
        .json({ error: 'You are not allowed to send messages for this ride' });
    }

    const messageDoc = await Message.create({
      ride: ride.id,
      sender: req.user.id,
      body: messageBody,
    });

    await messageDoc.populate('sender', 'name email photo');

    res.status(201).json(formatMessage(messageDoc, req.user.id));
  } catch (err) {
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Update the status of a seat request (driver only)
router.patch('/:id/requests/:requestId', authRequired, async (req, res) => {
  try {
    const { status } = req.body || {};
    if (!status || !['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Status must be approved or rejected' });
    }

    const ride = await Ride.findById(req.params.id)
      .populate('driver', 'name email photo')
      .populate('requests.passenger', 'name email photo');

    if (!ride) {
      return res.status(404).json({ error: 'Ride not found' });
    }

    const driverId = getDocumentId(ride.driver);
    if (!driverId || driverId !== req.user.id) {
      return res.status(403).json({ error: 'Only the driver can manage requests' });
    }

    const request = ride.requests.id(req.params.requestId);
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    if (request.status === status) {
      return res.json({
        rideId: ride.id,
        remainingSeats: computeRemainingSeats(ride),
        request: formatRequest(request),
      });
    }

    if (status === 'approved') {
      const reservedByOthers = ride.requests.reduce((total, current) => {
        if (current.id === request.id) {
          return total;
        }
        if (ACTIVE_REQUEST_STATUSES.has(current.status)) {
          return total + (current.seats || 0);
        }
        return total;
      }, 0);

      if (reservedByOthers + request.seats > ride.seats) {
        return res.status(400).json({ error: 'Not enough seats remaining to approve this request' });
      }
    }

    request.status = status;
    await ride.save();
    await ride.populate('requests.passenger', 'name email photo');

    const updatedRequest = ride.requests.id(req.params.requestId);
    const responseRequest = formatRequest(updatedRequest);
    const remainingSeats = computeRemainingSeats(ride);

    res.json({
      rideId: ride.id,
      remainingSeats,
      request: responseRequest,
    });

    notifySeatRequestStatusChange({
      ride,
      request: updatedRequest,
    }).catch((notifyErr) => {
      console.error('Failed to notify passenger about request update', notifyErr);
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update request status' });
  }
});


// Delete a ride (driver only)
router.delete('/:id', authRequired, async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id).populate('driver', '_id');
    if (!ride) {
      return res.status(404).json({ error: 'Ride not found' });
    }

    const driverId = getDocumentId(ride.driver);
    if (!driverId || driverId !== req.user.id) {
      return res.status(403).json({ error: 'Only the driver can delete this ride' });
    }

    await Ride.deleteOne({ _id: ride.id });

    return res.json({ rideId: ride.id, success: true });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete ride' });
  }
});

module.exports = router;








