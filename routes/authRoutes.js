//routes/authRoutes.js
const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../db/database');
const jwt = require('jsonwebtoken');
const authenticateToken  = require('../middleware/authenticateToken');
const { use } = require('bcrypt/promises');
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
    const userId = req.user.userId; 
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
      } else {
        res.status(404).json({ error: 'User not found' });
      }
    });
  }
    );


  //update user
  router.put('/update/user', authenticateToken, (req, res) => {
    const {  email,  address, dateOfBirth, profilePicture } = req.body;
    const userId = req.user.userId;
    const query = 'UPDATE users SET Email = ?, Address = ?, DateOfBirth = ?, Image = ? WHERE UserId = ?';
    db.run(query, [email, address, dateOfBirth, profilePicture, userId], (err) => {
      if (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
      } else {
        res.status(200).json({ message: `User ${userId} updated successfully` });
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
router.get('/users', authenticateToken, (req, res) => {
  const userId = req.user.userId;
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
              dateOfBirth: user.DateOfBirth,
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


// Create lapSwimSchedule
router.post('/create/lapSwimSchedule', authenticateToken, (req, res) => {
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


// Fetch lapSwimSchedule
router.get('/lapSwimSchedule', authenticateToken, (req, res) => {
  const query = 'SELECT * FROM lap_swim_schedules';
  db.all(query, (err, schedules) => {
    if (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    } else {
      res.status(200).json(schedules);
    }
  });
});
 

//create reservation
router.post('/create/reservation', authenticateToken, (req, res) => {
  const userId = req.user.userId;
  const { scheduleId, activityTypeId } = req.body;
  // Ensure you have validated or sanitized input data before inserting it into your database
  const status = 'open'; // Assuming 'open' is the default status for new reservations

  const query = 'INSERT INTO reservations (UserID, ActivityTypeID, ScheduleID, Status, StartTime, EndTime, Date) SELECT ?, ?, ?, ?, StartTime, EndTime, Date FROM lap_swim_schedules WHERE ScheduleID = ?';
  db.run(query, [userId, activityTypeId, scheduleId, status, scheduleId], (err) => {
    if (err) {
      console.error("SQL Error: ", err.message);
      res.status(500).json({ error: 'Internal server error', details: err.message });
      console.log("SQL Error: ", err.message);
    } else {
      res.status(201).json({ message: 'Reservation created successfully' });
  }
  });
});
// Fetch all reservations with activity names
router.get('/reservations', authenticateToken, (req, res) => {
  let query = `
      SELECT 
          reservations.ReservationID,
          users.FirstName AS userName,
          users.UserId,
          activity_types.ActivityName,
          reservations.Date,
          reservations.StartTime,
          reservations.EndTime,
          reservations.Status,
          reservations.IsCheckedIn
      FROM reservations
      JOIN users ON reservations.UserID = users.UserId
      JOIN activity_types ON reservations.ActivityTypeID = activity_types.ActivityID
      ORDER BY reservations.Date, reservations.StartTime
  `;

  db.all(query, [], (err, reservations) => {
      if (err) {
          console.error("Error fetching reservations:", err);
          return res.status(500).json({ error: 'Internal server error', details: err.message });
      } else {
          res.json({ reservations });
      }
  });
});




// Fetch users Upcoming Reservations
router.get('/upcoming/reservations', authenticateToken, (req, res) => {
  const userId = req.user.userId; // Assuming userID is stored in req.user

  // Updated query to remove activity type filtering unless needed for future use
  let query = `
    SELECT 
      reservations.*, 
      activity_types.ActivityName, 
      lap_swim_schedules.Date, 
      lap_swim_schedules.StartTime, 
      lap_swim_schedules.EndTime
    FROM reservations
    JOIN activity_types ON reservations.ActivityTypeID = activity_types.ActivityID
    LEFT JOIN lap_swim_schedules ON reservations.ScheduleID = lap_swim_schedules.ScheduleID
    WHERE reservations.UserID = ? AND reservations.Date >= CURRENT_DATE
    ORDER BY reservations.Date, lap_swim_schedules.StartTime
  `;

  db.all(query, [userId], (err, reservations) => {
      if (err) {
          console.error(err);
          return res.status(500).json({ error: 'Internal server error', details: err.message });
      }
      res.json({ upcomingReservations: reservations });
  });
});

//check in reservation 
router.put('/checkin/reservation', authenticateToken, (req, res) => {
  const reservationId = req.params.id;
  const query = 'UPDATE reservations SET IsCheckedIn = 1 WHERE ReservationID = ?';
  db.run(query, [reservationId], (err) => {
    if (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    } else {
      res.status(200).json({ message: `Reservation ${reservationId} checked in successfully` });
    }
  });
});



// Fetch Historical Reservations
router.get('/history', authenticateToken, (req, res) => {
  const userId = req.user.userId;
  const query = `
      SELECT * FROM reservations
      JOIN activity_types ON reservations.ActivityTypeID = activity_types.ActivityTypeID
      LEFT JOIN lap_swim_schedules ON reservations.ScheduleID = lap_swim_schedules.ScheduleID
      WHERE reservations.UserID = ? AND reservations.Date < CURRENT_DATE
      ORDER BY reservations.Date DESC, lap_swim_schedules.StartTime;
  `;
  db.all(query, [userId], (err, reservations) => {
      if (err) {
          console.error(err);
          return res.status(500).json({ error: 'Internal server error' });
      }
      res.json({ historicalReservations: reservations });
  });
});

router.get('/activities', (req, res) => {
  const query = 'SELECT ActivityID as id, ActivityName as name FROM activity_types';
  db.all(query, [], (err, activities) => {
      if (err) {
          console.error(err);
          return res.status(500).json({ error: 'Internal server error', details: err.message });
      }
      res.json(activities);
  });
});




  module.exports = router;
