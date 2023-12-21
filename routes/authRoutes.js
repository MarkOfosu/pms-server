//routes/authRoutes.js
const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../db/database');
const verifyLogin = require('../middleware/auth');
require('dotenv').config();

const router = express.Router();

router.post('/register', async (req, res) => {
    const {
        First_name,
        Last_name,
        Email_address,
         password 
        } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);
    db.run(`INSERT INTO users (First_name,Last_name,Email_address,hashed_password) VALUES (?, ?,?,?)`, [First_name,Last_name, Email_address, hashedPassword], function(err) {
        if (err) {
            return res.status(400).send({ error: err.message });
        }
        res.status(201).send({ id: this.lastID });
    });
});

router.post('/login', (req, res) => {
    const { email, password } = req.body;

    db.get("SELECT * FROM users WHERE Email_address = ?", [email], (err, user) => {
        if (err) {
            return res.status(500).send("Internal Server Error");
        }
        if (!user) {
            return res.status(401).send("Invalid email or password");
        }
        const isPasswordCorrect = bcrypt.compareSync(password, user.hashed_password);
        if (!isPasswordCorrect) {
            return res.status(401).send("Invalid email or password");
        }

        req.session.userId = user.Id; 
        
        res.status(200).json({ message: "Login successful" });
    });
});





router.get('/users',verifyLogin, (req, res) => {
    
    db.all("SELECT Id, First_name, Last_name, Email_address FROM users", (err, rows) => {
        if (err) {
            return res.status(500).json({ error: "Internal Server Error" });
        }
        const users = rows.map(row => {
            return {
                id: row.Id,
               FirstName: row.First_name,
                LastName: row.Last_name, 
                EmailAddress: row.Email_address                
            };
        });

        res.json({ users });
    });
});

router.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).send("Logout failed");
        }
        res.send("Logout successful");
    });
});




module.exports = router;
