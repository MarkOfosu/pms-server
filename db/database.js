//server/db/database.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');

require('dotenv').config();

const dbPath = path.resolve(__dirname, 'db.sqlite');
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
    if (err) {
        return console.error(err.message);
    }
    console.log('Connected to the SQLite database.');

    // all users table
    db.run(`CREATE TABLE IF NOT EXISTS users (
        UserId INTEGER PRIMARY KEY AUTOINCREMENT,
        UserName TEXT NOT NULL UNIQUE,
        Password TEXT NOT NULL,
        Email TEXT NOT NULL UNIQUE,
        FirstName TEXT NOT NULL,
        LastName TEXT NOT NULL,
        DateOfBirth DATE,
        Address TEXT,
        JoinDate DATE,
        UserType INTEGER,
        Image BLOB
        
    )`);

    // Create Profiles table
    db.run(`CREATE TABLE IF NOT EXISTS profiles (
        ProfileID INTEGER PRIMARY KEY AUTOINCREMENT,
        UserID INTEGER NOT NULL,
        AccountBalance REAL,
        PaymentDue REAL,
        FOREIGN KEY(UserID) REFERENCES users(UserId)
    )`);

    //Reservations Table
    db.run(`CREATE TABLE IF NOT EXISTS reservations (
        ReservationID INTEGER PRIMARY KEY AUTOINCREMENT,
        UserID INTEGER NOT NULL,
        ActivityTypeID INTEGER NOT NULL,
        ScheduleID INTEGER, -- Optional, based on your design
        StartTime DATETIME,
        EndTime DATETIME,
        Date DATE,
        Status TEXT CHECK(Status IN ('open', 'closed')), -- Enforcing 'open' or 'closed' status
        IsCheckedIn BOOLEAN DEFAULT 0, -- New field to track check-in status
        FOREIGN KEY(UserID) REFERENCES users(UserId),
        FOREIGN KEY(ActivityTypeID) REFERENCES activity_types(ActivityTypeID),
        FOREIGN KEY(ScheduleID) REFERENCES lap_swim_schedules(ScheduleID) -- If you decide to link schedules
    )`);
    
    //Activity Check-In Table
    db.run(`CREATE TABLE IF NOT EXISTS activity_check_in (
        CheckInID INTEGER PRIMARY KEY AUTOINCREMENT,
        UserID INTEGER NOT NULL,
        ReservationID INTEGER NOT NULL,
        CheckInTime DATETIME, -- Updated to include date
        FOREIGN KEY(UserID) REFERENCES users(UserId),
        FOREIGN KEY(ReservationID) REFERENCES reservations(ReservationID)
    )`);

    //payment_historytable
    db.run(`CREATE TABLE IF NOT EXISTS payment_history (
        PaymentID INTEGER PRIMARY KEY AUTOINCREMENT,
        UserID INTEGER NOT NULL,
        Amount REAL,
        Date DATE,
        Type TEXT,
        Description TEXT,
        FOREIGN KEY(UserID) REFERENCES users(UserId)
    )`);

    //lap_swim_schedules table
    db.run(`CREATE TABLE IF NOT EXISTS lap_swim_schedules (
        ScheduleID INTEGER PRIMARY KEY AUTOINCREMENT,
        Date DATE,
        StartTime Time,
        EndTime TIme,
        LaneNumber INTEGER,
        MaxSwimmers INTEGER
    )`);

    // Create admin user if it doesn't already exist
    db.get("SELECT * FROM users WHERE UserType = ?", [1030], (err, user) => {
        if (err) {
            console.error(err);
        } else if (!user) {
            const userName = process.env.ADMIN_USERNAME;
            const password = process.env.ADMIN_PASSWORD;
            const firstName = process.env.ADMIN_FIRST_NAME;
            const lastName = process.env.ADMIN_LAST_NAME;
            const email = process.env.ADMIN_EMAIL;
            const dateOfBirth = process.env.ADMIN_DATE_OF_BIRTH;
            const address = process.env.ADMIN_ADDRESS;
            const userType = 1030;
            const joinDate = new Date().toISOString().slice(0, 10);

            const hashedPassword = bcrypt.hashSync(password, 10);

            const query = 'INSERT INTO users (UserName, Password, FirstName, LastName, Email, DateOfBirth, Address, JoinDate, UserType) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
            db.run(query, [userName, hashedPassword, firstName, lastName, email, dateOfBirth, address, joinDate, userType], function(err) {
                if (err) {
                    console.error(err);
                } else {
                    console.log(`Admin user created with ID ${this.lastID}`);
                }
            });
        }
    });
});


module.exports = db;
