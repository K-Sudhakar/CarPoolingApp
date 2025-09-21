const express = require('express');
const passport = require('../auth/passport');
const config = require('../config');
const { authRequired } = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'], prompt: 'select_account' })
);

router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/auth/google' }),
  (req, res) => {
    // passport provides req.user from our strategy callback
    const { token } = req.user;
    const redirectUrl = `${config.clientOrigin}/auth/callback?token=${encodeURIComponent(token)}`;
    return res.redirect(302, redirectUrl);
  }
);

router.get('/me', authRequired, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('name email photo');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      photo: user.photo,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to load user profile' });
  }
});

module.exports = router;
