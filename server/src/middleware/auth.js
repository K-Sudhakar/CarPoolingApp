const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config');

function decodeToken(token) {
  if (!token) return null;
  try {
    return jwt.verify(token, jwtSecret);
  } catch (err) {
    return null;
  }
}

function authRequired(req, res, next) {
  const auth = req.headers.authorization || '';
  const [, token] = auth.split(' ');
  if (!token) return res.status(401).json({ error: 'Missing token' });
  const payload = decodeToken(token);
  if (!payload) {
    return res.status(401).json({ error: 'Invalid token' });
  }
  req.user = payload; // { id, email, name }
  next();
}

function optionalAuth(req, res, next) {
  const auth = req.headers.authorization || '';
  const [, token] = auth.split(' ');
  if (!token) {
    return next();
  }
  const payload = decodeToken(token);
  if (!payload) {
    return res.status(401).json({ error: 'Invalid token' });
  }
  req.user = payload;
  return next();
}

module.exports = { authRequired, optionalAuth };
