const dotenv = require('dotenv');
const path = require('path');
// Load env from the server folder regardless of process.cwd()
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

module.exports = {
  port: process.env.PORT || 4000,
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/carpool',
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:4200',
  jwtSecret: process.env.JWT_SECRET || 'dev_secret',
  google: {
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackPath: process.env.GOOGLE_CALLBACK_PATH || '/auth/google/callback',
  },
  notifications: {
    email: {
      enabled: process.env.NOTIFY_EMAIL_ENABLED === 'true',
      from: process.env.NOTIFY_EMAIL_FROM,
      transport: {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: process.env.SMTP_SECURE === 'true',
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    },
  },
};
