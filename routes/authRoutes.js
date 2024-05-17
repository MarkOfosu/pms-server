//routes/authRoutes.js
const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db/database');
const jwt = require('jsonwebtoken');
const authenticateToken  = require('../middleware/authenticateToken');
const upload = require('../middleware/multerConfig');
const { use } = require('bcryptjs');
require('dotenv').config();

const router = express.Router();

// Health Check route
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Service is up and running' });
});

// User Registration
router.post('/register', authenticateToken, async (req, res) => {
  const { userName, email, firstName, lastName, dateOfBirth, address, password, userType } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const joinDate = new Date().toISOString().slice(0, 10);

  // Start transaction
  db.serialize(() => {
      db.run("BEGIN TRANSACTION;");

      const userInsertQuery = 'INSERT INTO users (UserName, Password, FirstName, LastName, Email, DateOfBirth, Address, JoinDate, userType) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
      db.run(userInsertQuery, [userName, hashedPassword, firstName, lastName, email, dateOfBirth, address, joinDate, userType], function(userErr) {
          if (userErr) {
              console.error("Error registering new user:", userErr.message);
              db.run("ROLLBACK;");
              return res.status(500).json({ message: 'Error registering new user', error: userErr.message });
          }

          const newUserId = this.lastID; 

          // Create payment account for new user
          const accountQuery = `INSERT INTO payment_account (UserID, AccountBalance, PaymentDue, AccountCredit, AccountDebit) VALUES (?, 0, 0, 0, 0)`;
          db.run(accountQuery, [newUserId], function(accountErr) {
              if (accountErr) {
                  console.error("Error creating payment account:", accountErr.message);
                  db.run("ROLLBACK;");
                  return res.status(500).json({ message: 'Error creating payment account', error: accountErr.message });
              }

              // Add initial payment history entry
              const paymentHistoryQuery = `INSERT INTO payment_history (UserID, Amount, Date, Type, Description) VALUES (?, 0, ?, 'Initial', 'Initial account setup')`;
              db.run(paymentHistoryQuery, [newUserId, new Date().toISOString().slice(0, 10)], function(historyErr) {
                  if (historyErr) {
                      console.error("Error creating initial payment history:", historyErr.message);
                      db.run("ROLLBACK;");
                      return res.status(500).json({ message: 'Error creating initial payment history', error: historyErr.message });
                  }

                  // Commit the transaction
                  db.run("COMMIT;");
                  res.status(201).json({ message: `New user created with ID ${newUserId}` });
              });
          });
      });
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
                  token : token
                    
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


  // Update user profile
  router.put('/update/user', authenticateToken, upload.single('profilePicture'), (req, res) => {
    const { email, address, dateOfBirth } = req.body;
    const userId = req.user.userId;
    let profilePicture;

    if (req.file) {
      // The image URL that can be accessed publicly via HTTP
      profilePicture = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    } else {
      profilePicture = null;
    }
    
    const query = 'UPDATE users SET Email = ?, Address = ?, DateOfBirth = ?, Image = ? WHERE UserId = ?';
    db.run(query, [email, address, dateOfBirth, profilePicture, userId], (err) => {
      if (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
      } else {
        res.status(200).json({ message: 'User profile updated successfully', profileImage: profilePicture });
      }
    }
    );
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
 

// Create a new reservation
router.post('/create/reservation', authenticateToken, (req, res) => {
  const userId = req.user.userId;
  const { scheduleID, activityID } = req.body;

  const status = 'open';

  const query = `
    INSERT INTO reservations (UserID, ActivityTypeID, ScheduleID, Status, StartTime, EndTime, Date)
    SELECT ?, ?, ?, ?, StartTime, EndTime, Date
    FROM lap_swim_schedules
    WHERE ScheduleID = ?`;

  db.run(query, [userId, activityID, scheduleID, status, scheduleID], (err) => {
    if (err) {
      console.error("SQL Error:", err.message);
      res.status(500).json({ error: 'Internal server error', details: err.message });
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
  const userId = req.user.userId; 
  // Updated query to remove activity type filtering unless needed for future use
  let query = `
    SELECT * FROM reservations
    JOIN activity_types ON reservations.ActivityTypeID = activity_types.ActivityID
    LEFT JOIN lap_swim_schedules ON reservations.ScheduleID = lap_swim_schedules.ScheduleID
    WHERE reservations.UserID = ? AND reservations.Date >= CURRENT_DATE
    ORDER BY reservations.Date, lap_swim_schedules.StartTime;


   
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


router.get('/account', authenticateToken, (req, res) => {
  userId = req.user.userId;
  const query = 'SELECT * FROM payment_account WHERE UserID = ?';
  db.get(query, [userId], (err, account) => {
      if (err) {
          console.error(err);
          return res.status(500).json({ error: 'Internal server error' });
      }
      res.json({ account});
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
