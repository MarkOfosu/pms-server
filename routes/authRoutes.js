//routes/authRoutes.js
const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../db/database');
const jwt = require('jsonwebtoken');
const authenticateToken  = require('../middleware/authenticateToken');
require('dotenv').config();

const router = express.Router();

// User Registration
router.post('/register', authenticateToken, async (req, res) => {
    const { userName, email, firstName, lastName, dateOfBirth, address, password, userType } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const joinDate = new Date().toISOString().slice(0, 10);

    const query = 'INSERT INTO users (UserName, Password, FirstName, LastName, Email, DateOfBirth, Address, JoinDate, userType) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
    db.run(query, [userName, hashedPassword, firstName, lastName, email, dateOfBirth, address, joinDate, userType], function(err) {
        if (err) {
            console.error(err);
            res.status(500).json({ message: 'Error registering new user', error: err.message });
        } else {
            res.status(201).json({ message: `New user created with ID ${this.lastID}` });
        }
    });
});
  


// User Login
router.post('/login', async (req, res) => {
  const { userName, password } = req.body;
  const query = 'SELECT * FROM users WHERE UserName = ?';

  db.get(query, [userName], async (err, user) => {
      if (err) {
          console.error(err);
          res.status(500).json({ error: 'Internal server error' }); 
      } else if (!user) {
          res.status(404).json({ error: 'Username does not exist' }); 
      } else {
          const isPasswordMatch = await bcrypt.compare(password, user.Password);
          if (!isPasswordMatch) {
              res.status(401).json({ error: 'Invalid password' });
          } else {
              const token = jwt.sign({ userId: user.UserId }, process.env.JWT_SECRET, { expiresIn: '1h' });
              res.cookie('token', token, {
                  httpOnly: true,
                  secure: false, // should be true in production if using HTTPS
                  maxAge: 3600000 // 1 hour
              });
              res.status(200).json({
                  message: 'Logged in successfully',
                  firstName: user.FirstName,
                  userType: user.UserType,
                  profileImage: user.Image,
                    
              });
          }
      }
  });
});

// Check if user is logged in
router.get('/checkLoggedIn',  (req, res) => {
    const userId = req.user.userId; //'userId' is part of the token payload
    // Query the database for the user details using userId
    db.get('SELECT FirstName, UserType, ... FROM users WHERE UserId = ?', [userId], (err, user) => {
      if (err) {
        res.status(500).json({ error: 'Internal server error' });
      } else if (user) {
        res.statys(200).json({
          success: true,
          message: 'Token is valid',
          user: {
            firstName: user.FirstName,
            userType: user.UserType,
            profileImage: user.Image,
            
          }
        });
        console.log(user);
      } else {
        res.status(404).json({ error: 'User not found' });
      }
    });
  }
    );
  


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


  router.post('/logout', (req, res) => {
    res.clearCookie('token');
    res.status(200).json({ message: 'Logged out successfully' });
});
  



module.exports = router;
