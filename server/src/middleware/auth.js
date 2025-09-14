const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config');

function authRequired(req, res, next) {
  const auth = req.headers.authorization || '';
  const [, token] = auth.split(' ');
  if (!token) return res.status(401).json({ error: 'Missing token' });
  try {
    const payload = jwt.verify(token, jwtSecret);
    req.user = payload; // { id, email, name }
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

module.exports = { authRequired };

