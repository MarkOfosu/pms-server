//routes/authRoutes.js
const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../db/database');
const jwt = require('jsonwebtoken');
const authenticateToken  = require('../middleware/authenticateToken');
require('dotenv').config();

const router = express.Router();

// User Registration
router.post('/register', async (req, res) => {
    const { username, password, firstName, lastName, email, dateOfBirth, address } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
  
    const query = 'INSERT INTO users (Username, hashed_password, First_name, Last_name, Email, DateOfBirth, Address) VALUES (?, ?, ?, ?, ?, ?, ?)';
    db.run(query, [username, hashedPassword, firstName, lastName, email, dateOfBirth, address], function(err) {
      if (err) {
        res.status(500).send('Error registering new user');
      } else {
        res.status(201).send(`New user created with ID ${this.lastID}`);
      }
    });
  });
  

// User Login
router.post('/login', (req, res) => {
    const { username, password } = req.body;
    const query = 'SELECT * FROM users WHERE Username = ?';
  
    db.get(query, [username], async (err, user) => {
      if (err) {
        res.status(500).send('Error logging in');
      } else if (!user || !await bcrypt.compare(password, user.hashed_password)) {
        res.status(401).send('Invalid credentials');
      } else {
        const token = jwt.sign({ userId: user.Id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        const updateQuery = 'UPDATE users SET token = ? WHERE Id = ?';
        db.run(updateQuery, [token, user.Id], function(err) {
          if (err) {
            res.status(500).send('Error saving token');
          } else {
            res.json({ token });
          }
        });
      }
    });
  });



  router.get('/users', authenticateToken, (req, res) => {
    db.all("SELECT UserId, Username, FirstName, LastName, Email, DateOfBirth, Address FROM users", (err, rows) => {
        if (err) {
            return res.status(500).json({ error: "Internal Server Error" });
        }
        const users = rows.map(row => {
            return {
                id: row.UserId,
                username: row.Username,
                firstName: row.FirstName,
                lastName: row.LastName, 
                email: row.Email,
                dateOfBirth: row.DateOfBirth,
                address: row.Address                
            };
        });

        res.json({ users });
    });
});



router.post('/logout', authenticateToken, (req, res) => {
    const updateQuery = 'UPDATE users SET token = NULL WHERE id = ?';
    db.run(updateQuery, [req.user.userId], function(err) {
      if (err) {
        res.status(500).send('Error logging out');
      } else {
        res.send('Logged out successfully');
      }
    });
  });
  



module.exports = router;
