const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT
});

async function createTables() {
    const createUsersTable = `
        CREATE TABLE IF NOT EXISTS users (
            UserId SERIAL PRIMARY KEY,
            UserName VARCHAR(255) UNIQUE NOT NULL,
            Password VARCHAR(255) NOT NULL,
            FirstName VARCHAR(255) NOT NULL,
            LastName VARCHAR(255) NOT NULL,
            Email VARCHAR(255) UNIQUE NOT NULL,
            DateOfBirth DATE NOT NULL,
            Address VARCHAR(255) NOT NULL,
            JoinDate DATE NOT NULL,
            UserType INT NOT NULL,
            Image VARCHAR(255)
        );
    `;

    const createPaymentAccountTable = `
        CREATE TABLE IF NOT EXISTS payment_account (
            AccountID SERIAL PRIMARY KEY,
            UserID INT NOT NULL,
            AccountBalance DECIMAL(10, 2) NOT NULL,
            PaymentDue DECIMAL(10, 2) NOT NULL,
            AccountCredit DECIMAL(10, 2) NOT NULL,
            AccountDebit DECIMAL(10, 2) NOT NULL,
            FOREIGN KEY (UserID) REFERENCES users(UserId) ON DELETE CASCADE
        );
    `;

    const createPaymentHistoryTable = `
        CREATE TABLE IF NOT EXISTS payment_history (
            HistoryID SERIAL PRIMARY KEY,
            UserID INT NOT NULL,
            Amount DECIMAL(10, 2) NOT NULL,
            Date DATE NOT NULL,
            Type VARCHAR(50) NOT NULL,
            Description TEXT NOT NULL,
            FOREIGN KEY (UserID) REFERENCES users(UserId) ON DELETE CASCADE
        );
    `;

    const createActivityTypesTable = `
        CREATE TABLE IF NOT EXISTS activity_types (
            ActivityID SERIAL PRIMARY KEY,
            ActivityName VARCHAR(255) UNIQUE NOT NULL
        );
    `;

    const createLapSwimSchedulesTable = `
        CREATE TABLE IF NOT EXISTS lap_swim_schedules (
            ScheduleID SERIAL PRIMARY KEY,
            Date DATE NOT NULL,
            StartTime TIME NOT NULL,
            EndTime TIME NOT NULL,
            LaneNumber INT NOT NULL,
            MaxSwimmers INT NOT NULL
        );
    `;

    const createReservationHistoryTable = `
        CREATE TABLE IF NOT EXISTS reservation_history (
            HistoryID SERIAL PRIMARY KEY,
            UserID INT NOT NULL,
            ReservationID INT NOT NULL,
            CheckInDate DATE NOT NULL,
            FOREIGN KEY (UserID) REFERENCES users(UserId) ON DELETE CASCADE,
            FOREIGN KEY (ReservationID) REFERENCES reservations(ReservationID) ON DELETE CASCADE
        );
    `;

    const createReservationsTable = `
        CREATE TABLE IF NOT EXISTS reservations (
            ReservationID SERIAL PRIMARY KEY,
            UserID INT NOT NULL,
            ActivityTypeID INT NOT NULL,
            ScheduleID INT NOT NULL,
            Status VARCHAR(50) NOT NULL,
            StartTime TIME NOT NULL,
            EndTime TIME NOT NULL,
            Date DATE NOT NULL,
            IsCheckedIn BOOLEAN DEFAULT FALSE,
            FOREIGN KEY (UserID) REFERENCES users(UserId) ON DELETE CASCADE,
            FOREIGN KEY (ActivityTypeID) REFERENCES activity_types(ActivityID) ON DELETE CASCADE,
            FOREIGN KEY (ScheduleID) REFERENCES lap_swim_schedules(ScheduleID) ON DELETE CASCADE
        );
    `;

    try {
        const client = await pool.connect();
        await client.query(createUsersTable);
        await client.query(createPaymentAccountTable);
        await client.query(createPaymentHistoryTable);
        await client.query(createActivityTypesTable);
        await client.query(createLapSwimSchedulesTable);
        await client.query(createReservationsTable); 
        await client.query(createReservationHistoryTable);
        client.release();
        console.log('Tables created successfully');
    } catch (err) {
        console.error('Error creating tables:', err.message);
    }
}

module.exports = { createTables, pool };
