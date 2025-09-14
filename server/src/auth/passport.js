const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config');

// Configure Google OAuth strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: config.google.clientID,
      clientSecret: config.google.clientSecret,
      callbackURL: config.google.callbackPath,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        const userData = {
          googleId: profile.id,
          name: profile.displayName,
          email,
          photo: profile.photos?.[0]?.value,
        };

        let user = null;

        if (email) {
          user = await User.findOneAndUpdate(
            { email },
            { $setOnInsert: userData, $set: { googleId: profile.id, photo: userData.photo, name: userData.name } },
            { new: true, upsert: true }
          );
        } else {
          user = await User.findOneAndUpdate(
            { googleId: profile.id },
            { $setOnInsert: userData, $set: { photo: userData.photo, name: userData.name } },
            { new: true, upsert: true }
          );
        }

        const token = jwt.sign(
          { id: user.id, email: user.email, name: user.name },
          config.jwtSecret,
          { expiresIn: '7d' }
        );

        return done(null, { user, token });
      } catch (err) {
        return done(err);
      }
    }
  )
);

module.exports = passport;

