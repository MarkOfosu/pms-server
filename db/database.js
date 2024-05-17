//server/db/database.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const dbPath = path.resolve(__dirname, 'db.sqlite');
const {initializeUsers} = require('./dbActions');

const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
    if (err) {
        console.error('Failed to connect to the database:', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        initializeUsers(db);
    }
});

db.serialize(() => {
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

    //Create PayementAccounts table to store balances, payment due, and payment history
    db.run(`CREATE TABLE IF NOT EXISTS payment_account (
        AccountID INTEGER PRIMARY KEY AUTOINCREMENT,
        UserID INTEGER NOT NULL,
        AccountBalance REAL CHECK(AccountBalance >= 0),
        PaymentDue REAL CHECK(PaymentDue >= 0),
        AccountCredit REAL,
        AccountDebit REAL,
        FOREIGN KEY(UserID) REFERENCES users(UserId),
        CHECK(AccountBalance >= PaymentDue)
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

    db.run(`CREATE TABLE IF NOT EXISTS activity_types (
        ActivityID INTEGER PRIMARY KEY,
        ActivityName TEXT NOT NULL UNIQUE
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS activity_check_in (
        CheckInID INTEGER PRIMARY KEY AUTOINCREMENT,
        UserID INTEGER NOT NULL,
        ReservationID INTEGER NOT NULL,
        CheckInTime DATETIME,
        FOREIGN KEY(UserID) REFERENCES users(UserId),
        FOREIGN KEY(ReservationID) REFERENCES reservations(ReservationID)
    )`);

});

module.exports = db;
    

