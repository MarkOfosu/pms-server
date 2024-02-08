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
router.get('/checkLoggedIn', authenticateToken, (req, res) => {
    const userId = req.user.userId; //'userId' is part of the token payload
    console.log('userId22',userId);
    // Query the database for the user details using userId
    db.get('SELECT FirstName, UserType, Image  FROM users WHERE UserId = ?', [userId], (err, user) => {
      if (err) {
        res.status(500).json({ error: 'Internal server error' });
      } else if (user) {
        res.status(200).json({
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

  //update user
  router.put('/update/user', authenticateToken, (req, res) => {
    const { firstName, lastName, email, dateOfBirth, address } = req.body;
    const id = req.params.id;
    const query = 'UPDATE users SET FirstName = ?, LastName = ?, Email = ?, DateOfBirth = ?, Address = ? WHERE UserId = ?';
    db.run(query, [firstName, lastName, email, dateOfBirth, address, id], (err) => {
      if (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
      } else {
        res.status(201).json({ message: 'Schedule created successfully' });

      }
    });
  });

  //delete user
  router.delete('/delete/user', authenticateToken, (req, res) => {
    const id = req.params.id;
    const query = 'DELETE FROM users WHERE UserId = ?';
    db.run(query, [id], (err) => {
      if (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
      } else {
        res.status(200).json({ message: `User ${id} deleted successfully` });
      }
    });
  });

 // get a user
router.get('/user', authenticateToken, (req, res) => {
  const userId = req.user.userId; // Get the user ID from the authenticated user's token
  const query = 'SELECT * FROM users WHERE UserId = ?';
  db.get(query, [userId], (err, user) => {
      if (err) {
          console.error(err);
          res.status(500).json({ error: 'Internal server error' });
      } else if (!user) {
          res.status(404).json({ error: 'User not found' });
      } else {
          res.status(200).json({
              lastName: user.LastName,
              firstName: user.FirstName,
              title: user.Title,
              email: user.Email,
              phoneNumber: user.PhoneNumber,
              address: user.Address,
              profilePicture: user.Image
          });
      }
  });
});


  router.post('/logout', (req, res) => {
    res.clearCookie('token');
    res.status(200).json({ message: 'Logged out successfully' });
  });


// Create a new lapSwimSchedule
router.post('/lapSwimSchedule', authenticateToken, (req, res) => {
  const { date, startTime, endTime, lane, maxSwimmers } = req.body;
  const query = 'INSERT INTO lap_swim_schedules (Date, StartTime, EndTime, LaneNumber, MaxSwimmers) VALUES (?, ?, ?, ?, ?)';;
  db.run(query, [date, startTime, endTime,lane,  maxSwimmers], (err) => {
    if (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    } else {
      res.status(201).json({ message: `Schedule created successfully` });
    }
  });
});


  module.exports = router;
