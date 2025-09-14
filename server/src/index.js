const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const passport = require('./auth/passport');
const config = require('./config');

const authRoutes = require('./routes/auth');
const rideRoutes = require('./routes/rides');

async function start() {
  await mongoose.connect(config.mongoUri);

  const app = express();

  app.use(
    cors({
      origin: config.clientOrigin,
      credentials: true,
      allowedHeaders: ['Content-Type', 'Authorization'],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    })
  );
  app.use(express.json());
  app.use(cookieParser());
  app.use(passport.initialize());

  app.get('/health', (req, res) => res.json({ ok: true }));

  app.use('/auth', authRoutes);
  app.use('/api/rides', rideRoutes);

  app.listen(config.port, () => {
    console.log(`API listening on http://localhost:${config.port}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server', err);
  process.exit(1);
});

