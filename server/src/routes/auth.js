const express = require('express');
const passport = require('../auth/passport');
const config = require('../config');

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

module.exports = router;

