const sqlite3 = require('sqlite3').verbose();
const path = require('path');
require('dotenv').config();

const dbPath = path.resolve(__dirname, 'db.sqlite');

const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
    if (err) {
        console.error('Failed to connect to the database:', err.message);
    } else {
        console.log('Connected to the SQLite database.');
    }
});

db.serialize(() => {
    // Tables creation
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
    db.run(`CREATE TABLE IF NOT EXISTS payment_account (
        AccountID INTEGER PRIMARY KEY AUTOINCREMENT,
        UserID INTEGER NOT NULL,
        AccountBalance REAL, 
        PaymentDue REAL CHECK(PaymentDue >= 0),  
        AccountCredit REAL DEFAULT 0,
        AccountDebit REAL DEFAULT 0,
        FOREIGN KEY(UserID) REFERENCES users(UserId)
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS profiles (
        ProfileID INTEGER PRIMARY KEY AUTOINCREMENT,
        UserID INTEGER NOT NULL,
        AccountBalance REAL,
        PaymentDue REAL,
        FOREIGN KEY(UserID) REFERENCES users(UserId)
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS reservations (
        ReservationID INTEGER PRIMARY KEY AUTOINCREMENT,
        UserID INTEGER NOT NULL,
        ActivityTypeID INTEGER NOT NULL,
        ScheduleID INTEGER,
        StartTime DATETIME,
        EndTime DATETIME,
        Date DATE,
        Status TEXT CHECK(Status IN ('open', 'closed')),
        IsCheckedIn BOOLEAN DEFAULT 0,
        FOREIGN KEY(UserID) REFERENCES users(UserId),
        FOREIGN KEY(ActivityTypeID) REFERENCES activity_types(ActivityTypeID),
        FOREIGN KEY(ScheduleID) REFERENCES lap_swim_schedules(ScheduleID)
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS activity_check_in (
        CheckInID INTEGER PRIMARY KEY AUTOINCREMENT,
        UserID INTEGER NOT NULL,
        ReservationID INTEGER NOT NULL,
        CheckInTime DATETIME,
        FOREIGN KEY(UserID) REFERENCES users(UserId),
        FOREIGN KEY(ReservationID) REFERENCES reservations(ReservationID)
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS payment_history (
        PaymentID INTEGER PRIMARY KEY AUTOINCREMENT,
        UserID INTEGER NOT NULL,
        Amount REAL,
        Date DATE,
        Type TEXT,
        Description TEXT,
        FOREIGN KEY(UserID) REFERENCES users(UserId)
    )`);
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
    db.run(`CREATE TABLE IF NOT EXISTS reservation_history (
        HistoryID INTEGER PRIMARY KEY AUTOINCREMENT,
        UserID INTEGER,
        ReservationID INTEGER,
        CheckInDate DATETIME,
        FOREIGN KEY(UserID) REFERENCES users(UserId),
        FOREIGN KEY(ReservationID) REFERENCES reservations(ReservationID)
    )`);
});

module.exports = db;
