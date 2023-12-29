// middleware/auth.js

// middleware/authenticateToken.js
const jwt = require('jsonwebtoken');
const db = require('../db/db.sqlite');

//JWT_SECRET is from .env file

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).send('Access Denied');

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) =>{
    if (err) return res.status(403).send('Invalid Token');
    const query = 'SELECT * FROM users WHERE id = ? AND token = ?';
    db.get(query, [decoded.userId, token], (err, user) => {
      if (err || !user) {
        return res.status(403).send('Invalid Token');
      }
      req.user = decoded;
      next();
    });
  });
}

module.exports = authenticateToken;

