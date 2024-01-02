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

    // Create Users table
    db.run(`CREATE TABLE IF NOT EXISTS users (
        UserId INTEGER PRIMARY KEY AUTOINCREMENT,
        UserName TEXT NOT NULL UNIQUE,
        Password TEXT NOT NULL,
        Email TEXT NOT NULL UNIQUE,
        FirstName TEXT NOT NULL,
        LastName TEXT NOT NULL,
        DateOfBirth DATE,
        Address TEXT,
        JoinDate DATE
    )`);

    // Create Profiles table
    db.run(`CREATE TABLE IF NOT EXISTS profiles (
        ProfileID INTEGER PRIMARY KEY AUTOINCREMENT,
        UserID INTEGER NOT NULL,
        AccountBalance REAL,
        PaymentDue REAL,
        FOREIGN KEY(UserID) REFERENCES users(UserId)
    )`);

    // Create ActivityTypes table
    db.run(`CREATE TABLE IF NOT EXISTS activity_types (
        ActivityTypeID INTEGER PRIMARY KEY AUTOINCREMENT,
        ActivityName TEXT NOT NULL
    )`);

    // Create Reservations table
    db.run(`CREATE TABLE IF NOT EXISTS reservations (
        ReservationID INTEGER PRIMARY KEY AUTOINCREMENT,
        UserID INTEGER NOT NULL,
        ActivityTypeID INTEGER NOT NULL,
        StartTime TIME,
        EndTime TIME,
        Date DATE,
        Status TEXT,
        FOREIGN KEY(UserID) REFERENCES users(UserId),
        FOREIGN KEY(ActivityTypeID) REFERENCES activity_types(ActivityTypeID)
    )`);

    // Create Activity Check-In table
    db.run(`CREATE TABLE IF NOT EXISTS activity_check_in (
        CheckInID INTEGER PRIMARY KEY AUTOINCREMENT,
        UserID INTEGER NOT NULL,
        ReservationID INTEGER NOT NULL,
        CheckInTime TIME,
        FOREIGN KEY(UserID) REFERENCES users(UserId),
        FOREIGN KEY(ReservationID) REFERENCES reservations(ReservationID)
    )`);

    // Create Payment History table
    db.run(`CREATE TABLE IF NOT EXISTS payment_history (
        PaymentID INTEGER PRIMARY KEY AUTOINCREMENT,
        UserID INTEGER NOT NULL,
        Amount REAL,
        Date DATE,
        Type TEXT,
        Description TEXT,
        FOREIGN KEY(UserID) REFERENCES users(UserId)
    )`);

    // Create admin user if it doesn't already exist
    // db.get("SELECT * FROM users WHERE Email = ?", ['admin@gmail.com'], (err, user) => {
    //     if (err) {
    //         return console.error(err.message);
    //     }
    //     if (!user) {
    //         const hashedPassword = bcrypt.hashSync('Go!', 10);
    //         db.run(`INSERT INTO users (Username, Password, Email, FirstName, LastName, JoinDate) VALUES (?, ?, ?, ?, ?, ?)`, ['admin', hashedPassword, 'mark@gmail.com', 'Mark', 'Ofosu', new Date().toISOString().split('T')[0]], function(err) {
    //             if (err) {
    //                 return console.error(err.message);
    //             }
    //             console.log(`Admin user created with id ${this.lastID}`);
    //         });
    //     }
    // });
});

module.exports = db;
