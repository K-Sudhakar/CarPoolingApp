const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config');

// Configure Google OAuth strategy
if (!config.google.clientID || !config.google.clientSecret) {
  throw new Error(
    'Missing GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET. Set them in server/.env (see server/.env.example).'
  );
}

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
          // Upsert by email; always set current profile data
          user = await User.findOneAndUpdate(
            { email },
            { $set: { googleId: profile.id, photo: userData.photo, name: userData.name } },
            { new: true, upsert: true }
          );
        } else {
          // Upsert by Google ID when email not provided by Google
          user = await User.findOneAndUpdate(
            { googleId: profile.id },
            { $set: { photo: userData.photo, name: userData.name } },
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
