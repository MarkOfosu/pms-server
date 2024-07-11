const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authenticateToken = require('../middleware/authenticateToken');
const upload = require('../middleware/multerConfig');
require('dotenv').config();
const { pool } = require('../db/database');

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

    try {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const userInsertQuery = 'INSERT INTO users (UserName, Password, FirstName, LastName, Email, DateOfBirth, Address, JoinDate, userType) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING UserId';
            const userResult = await client.query(userInsertQuery, [userName, hashedPassword, firstName, lastName, email, dateOfBirth, address, joinDate, userType]);
            const newUserId = userResult.rows[0].userid;

            const accountQuery = 'INSERT INTO payment_account (UserID, AccountBalance, PaymentDue, AccountCredit, AccountDebit) VALUES ($1, 0, 0, 0, 0)';
            await client.query(accountQuery, [newUserId]);

            const paymentHistoryQuery = 'INSERT INTO payment_history (UserID, Amount, Date, Type, Description) VALUES ($1, 0, $2, $3, $4)';
            await client.query(paymentHistoryQuery, [newUserId, new Date().toISOString().slice(0, 10), 'Initial', 'Initial account setup']);

            await client.query('COMMIT');
            res.status(201).json({ message: `New user created with ID ${newUserId}` });
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Error during user registration:', error.message);
            res.status(500).json({ message: 'Error registering new user', error: error.message });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error connecting to the database:', error.message);
        res.status(500).json({ message: 'Error connecting to the database', error: error.message });
    }
});

// User Login
router.post('/login', async (req, res) => {
    const { userName, password } = req.body;
    const query = 'SELECT * FROM users WHERE UserName = $1';

    try {
        const result = await pool.query(query, [userName]);
        const user = result.rows[0];

        if (!user) {
            res.status(404).json({ error: 'Username does not exist' });
        } else {
            const isPasswordMatch = await bcrypt.compare(password, user.password);
            if (!isPasswordMatch) {
                res.status(401).json({ error: 'Invalid password' });
            } else {
                const token = jwt.sign({ userId: user.userid }, process.env.JWT_SECRET, { expiresIn: '1h' });
                res.cookie('token', token, {
                    httpOnly: true,
                    secure: true, 
                    maxAge: 21000000, // 5.83 hours
                });
                res.status(200).json({
                    message: 'Logged in successfully',
                    firstName: user.firstname,
                    userType: user.usertype,
                    profileImage: user.image
                });
            }
        }
    } catch (error) {
        console.error('Error during user login:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});




// Update user profile
router.put('/update/user', authenticateToken, upload.single('profilePicture'), async (req, res) => {
    const { email, address, dateOfBirth } = req.body;
    const userId = req.user.userId;
    let profilePicture = req.file ? req.file.filename : null;

    const query = 'UPDATE users SET Email = $1, Address = $2, DateOfBirth = $3, Image = $4 WHERE UserId = $5';

    try {
        await pool.query(query, [email, address, dateOfBirth, profilePicture, userId]);
        res.status(200).json({ message: 'User profile updated successfully', profileImage: profilePicture });
    } catch (error) {
        console.error('Error updating user profile:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete user
router.delete('/delete/user', authenticateToken, async (req, res) => {
    const userId = req.user.userId;
    const query = 'DELETE FROM users WHERE UserId = $1';

    try {
        await pool.query(query, [userId]);
        res.status(200).json({ message: `User ${userId} deleted successfully` });
    } catch (error) {
        console.error('Error deleting user:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get a user
router.get('/users', authenticateToken, async (req, res) => {
    const userId = req.user.userId;
    const query = 'SELECT * FROM users WHERE UserId = $1';

    try {
        const result = await pool.query(query, [userId]);
        const user = result.rows[0];

        if (!user) {
            res.status(404).json({ error: 'User not found' });
        } else {
            res.status(200).json({
                lastName: user.lastname,
                firstName: user.firstname,
                title: user.title,
                email: user.email,
                dateOfBirth: user.dateofbirth,
                address: user.address,
                profilePicture: user.image
            });
        }
    } catch (error) {
        console.error('Error fetching user:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// User logout
router.post('/logout', (req, res) => {
    res.clearCookie('token');
    res.status(200).json({ message: 'Logged out successfully' });
});

// Create lapSwimSchedule
router.post('/create/lapSwimSchedule', authenticateToken, async (req, res) => {
    const { date, startTime, endTime, lane, maxSwimmers } = req.body;
    const query = 'INSERT INTO lap_swim_schedules (Date, StartTime, EndTime, LaneNumber, MaxSwimmers) VALUES ($1, $2, $3, $4, $5)';

    try {
        await pool.query(query, [date, startTime, endTime, lane, maxSwimmers]);
        res.status(201).json({ message: 'Schedule created successfully' });
    } catch (error) {
        console.error('Error creating schedule:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Fetch lapSwimSchedule
router.get('/lapSwimSchedule', authenticateToken, async (req, res) => {
    const query = 'SELECT * FROM lap_swim_schedules';

    try {
        const result = await pool.query(query);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error fetching schedules:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create a new reservation
router.post('/create/reservation', authenticateToken, async (req, res) => {
    const userId = req.user.userId;
    const { scheduleID, activityID } = req.body;
    const status = 'open';

    const query = `
        INSERT INTO reservations (UserID, ActivityTypeID, ScheduleID, Status, StartTime, EndTime, Date)
        SELECT $1, $2, $3, $4, StartTime, EndTime, Date
        FROM lap_swim_schedules
        WHERE ScheduleID = $5`;

    try {
        await pool.query(query, [userId, activityID, scheduleID, status, scheduleID]);
        res.status(201).json({ message: 'Reservation created successfully' });
    } catch (error) {
        console.error('Error creating reservation:', error.message);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});

// Fetch all reservations with activity names
router.get('/reservations', authenticateToken, async (req, res) => {
    const query = `
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
        ORDER BY reservations.Date, reservations.StartTime`;

    try {
        const result = await pool.query(query);
        res.json({ reservations: result.rows });
    } catch (error) {
        console.error('Error fetching reservations:', error.message);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});

// Fetch users' upcoming reservations
router.get('/upcoming/reservations', authenticateToken, async (req, res) => {
    const userId = req.user.userId;
    const query = `
        SELECT * FROM reservations
        JOIN activity_types ON reservations.ActivityTypeID = activity_types.ActivityID
        LEFT JOIN lap_swim_schedules ON reservations.ScheduleID = lap_swim_schedules.ScheduleID
        WHERE reservations.UserID = $1 AND reservations.Date >= CURRENT_DATE
        ORDER BY reservations.Date, lap_swim_schedules.StartTime`;

    try {
        const result = await pool.query(query, [userId]);
        res.json({ upcomingReservations: result.rows });
    } catch (error) {
        console.error('Error fetching upcoming reservations:', error.message);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});

// Check-in reservation
router.put('/checkin/reservation/:reservationId', authenticateToken, async (req, res) => {
    const { reservationId } = req.params;
    const checkInDate = new Date().toISOString();

    try {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const checkInQuery = 'UPDATE reservations SET IsCheckedIn = $1 WHERE ReservationID = $2';
            await client.query(checkInQuery, [true, reservationId]);

            const historyQuery = 'INSERT INTO reservation_history (UserID, ReservationID, CheckInDate) SELECT UserID, ReservationID, $1 FROM reservations WHERE ReservationID = $2';
            await client.query(historyQuery, [checkInDate, reservationId]);

            const billingQuery = 'UPDATE payment_account SET AccountBalance = AccountBalance + 5, PaymentDue = PaymentDue + 5 WHERE UserID = (SELECT UserID FROM reservations WHERE ReservationID = $1)';
            await client.query(billingQuery, [reservationId]);

            await client.query('COMMIT');
            res.status(200).json({ message: 'Check-in successful, history updated, and user billed $5' });
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Error during check-in:', error.message);
            res.status(500).json({ error: 'Failed to check in', details: error.message });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error connecting to the database:', error.message);
        res.status(500).json({ error: 'Failed to connect to the database', details: error.message });
    }
});

// Fetch payment account
router.get('/account', authenticateToken, async (req, res) => {
    const userId = req.user.userId;
    const query = 'SELECT * FROM payment_account WHERE UserID = $1';

    try {
        const result = await pool.query(query, [userId]);
        res.json({ account: result.rows[0] });
    } catch (error) {
        console.error('Error fetching payment account:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Fetch historical reservations
router.get('/history', authenticateToken, async (req, res) => {
    const userId = req.user.userId;
    const query = `
        SELECT rh.*, at.ActivityName, ls.StartTime, ls.EndTime, ls.Date,
               u.FirstName, u.LastName, u.Email
        FROM reservation_history rh
        JOIN reservations r ON rh.ReservationID = r.ReservationID
        JOIN users u ON r.UserID = u.UserId
        JOIN activity_types at ON r.ActivityTypeID = at.ActivityID
        LEFT JOIN lap_swim_schedules ls ON r.ScheduleID = ls.ScheduleID
        WHERE r.UserID = $1 AND ls.Date < CURRENT_DATE
        ORDER BY ls.Date DESC, ls.StartTime`;

    try {
        const result = await pool.query(query, [userId]);
        res.json({ historicalReservations: result.rows });
    } catch (error) {
        console.error('Error fetching historical reservations:', error.message);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});

// Fetch activity types
router.get('/activities', async (req, res) => {
    const query = 'SELECT ActivityID as id, ActivityName as name FROM activity_types';

    try {
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching activities:', error.message);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});

module.exports = router;

