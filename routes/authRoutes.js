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
    const { userName, email, firstName, lastName, dateOfBirth, address, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const joinDate = new Date().toISOString().slice(0, 10);

    const query = 'INSERT INTO users (UserName, Password, FirstName, LastName, Email, DateOfBirth, Address, JoinDate) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
    db.run(query, [userName, hashedPassword, firstName, lastName, email, dateOfBirth, address, joinDate], function(err) {
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
    const query = 'SELECT * FROM users WHERE Username = ?';
  
    db.get(query, [userName], async (err, user) => {
      if (err) {
        res.status(500).send('Error logging in');
      } else if (!user || !await bcrypt.compare(password, user.Password)) {
        res.status(401).send('Invalid credentials');
      } else {
        const token = jwt.sign({ name: user.FirstName }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.cookie('token', token, {
            httpOnly: true,
            secure: 'false', 
            maxAge: 3600000 // 1 hour
        });
        res.status(200).json({ message: 'Logged in successfully' });
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
    res.clearCookie('token');
    res.send('Logged out successfully');
});
  



module.exports = router;
