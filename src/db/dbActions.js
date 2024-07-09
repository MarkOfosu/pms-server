const bcrypt = require('bcryptjs');
const { createTables, pool } = require('./database'); // Adjust the path according to your file structure

// Initialize users and other data
async function initializeUsers() {
    await createAdminUser();
    await createPublicUser();
    await createActivityTypes();
    await createLapSwimSchedules();
    await ensureFinancialRecords();
}

// Create Admin user
async function createAdminUser() {
    const userType = 1030; // Admin user type
    try {
        const userResult = await pool.query("SELECT UserId FROM users WHERE UserType = $1", [userType]);
        if (userResult.rows.length === 0) {
            const hashedPassword = bcrypt.hashSync(process.env.ADMIN_PASSWORD, 10);
            await pool.query("INSERT INTO users (UserName, Password, FirstName, LastName, Email, DateOfBirth, Address, JoinDate, UserType) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)", [
                process.env.ADMIN_USERNAME,
                hashedPassword,
                process.env.ADMIN_FIRST_NAME,
                process.env.ADMIN_LAST_NAME,
                process.env.ADMIN_EMAIL,
                process.env.ADMIN_DATE_OF_BIRTH,
                process.env.ADMIN_ADDRESS,
                new Date().toISOString().slice(0, 10),
                userType
            ]);
            console.log(`Admin user created`);
        }
    } catch (err) {
        console.error("Error creating admin user:", err.message);
    }
}

// Create Public user
async function createPublicUser() {
    const userType = 1020; // Public user type
    try {
        const userResult = await pool.query("SELECT UserId FROM users WHERE UserType = $1", [userType]);
        if (userResult.rows.length === 0) {
            const hashedPassword = bcrypt.hashSync(process.env.PUBLIC_PASSWORD, 10);
            await pool.query("INSERT INTO users (UserName, Password, FirstName, LastName, Email, DateOfBirth, Address, JoinDate, UserType) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)", [
                process.env.PUBLIC_USERNAME,
                hashedPassword,
                process.env.PUBLIC_FIRST_NAME,
                process.env.PUBLIC_LAST_NAME,
                process.env.PUBLIC_EMAIL,
                process.env.PUBLIC_DATE_OF_BIRTH,
                process.env.PUBLIC_ADDRESS,
                new Date().toISOString().slice(0, 10),
                userType
            ]);
            console.log(`Public user created`);
        }
    } catch (err) {
        console.error("Error creating public user:", err.message);
    }
}

// Create activity types
async function createActivityTypes() {
    const activityTypes = ['Lap Swim', 'Aqua Aerobics', 'Swim Lessons', 'Family Swim', 'Swim Team', 'Water Polo'];
    try {
        for (const activity of activityTypes) {
            const result = await pool.query("SELECT ActivityID FROM activity_types WHERE ActivityName = $1", [activity]);
            if (result.rows.length === 0) {
                await pool.query("INSERT INTO activity_types (ActivityName) VALUES ($1)", [activity]);
                console.log(`Activity type ${activity} created`);
            }
        }
    } catch (err) {
        console.error("Error creating activity types:", err.message);
    }
}

// Create lap swim schedules
async function createLapSwimSchedules() {
    const startTimes = ['07:00:00', '08:00:00', '10:00:00'];
    const endTimes = ['08:00:00', '09:00:00', '11:00:00'];
    const laneNumber = 1;
    const maxSwimmers = 5;

    const today = new Date();
    const schedules = [];

    for (let i = 0; i < 5; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        const formattedDate = date.toISOString().slice(0, 10);

        for (let j = 0; j < startTimes.length; j++) {
            schedules.push({
                Date: formattedDate,
                StartTime: startTimes[j],
                EndTime: endTimes[j],
                LaneNumber: laneNumber,
                MaxSwimmers: maxSwimmers
            });
        }
    }

    try {
        for (const schedule of schedules) {
            const result = await pool.query("SELECT ScheduleID FROM lap_swim_schedules WHERE Date = $1 AND StartTime = $2 AND EndTime = $3", [schedule.Date, schedule.StartTime, schedule.EndTime]);
            if (result.rows.length === 0) {
                await pool.query("INSERT INTO lap_swim_schedules (Date, StartTime, EndTime, LaneNumber, MaxSwimmers) VALUES ($1, $2, $3, $4, $5)", [schedule.Date, schedule.StartTime, schedule.EndTime, schedule.LaneNumber, schedule.MaxSwimmers]);
                console.log(`Lap swim schedule created for date: ${schedule.Date}, start time: ${schedule.StartTime}`);
            }
        }
    } catch (err) {
        console.error("Error creating lap swim schedules:", err.message);
    }
}



// Ensure financial records
async function ensureFinancialRecords() {
    try {
        const users = await pool.query("SELECT UserId FROM users");
        for (const row of users.rows) {
            await createPaymentAccountIfNeeded(row.userid);
            await createPaymentHistoryIfNeeded(row.userid);
        }
    } catch (err) {
        console.error("Error ensuring financial records:", err.message);
    }
}

// Create payment account if needed
async function createPaymentAccountIfNeeded(userId) {
    try {
        const result = await pool.query("SELECT * FROM payment_account WHERE UserID = $1", [userId]);
        if (result.rows.length === 0) {
            await pool.query("INSERT INTO payment_account (UserID, AccountBalance, PaymentDue, AccountCredit, AccountDebit) VALUES ($1, 0, 0, 0, 0)", [userId]);
            console.log(`Payment account created for user ID ${userId}`);
        }
    } catch (err) {
        console.error("Error creating payment account:", err.message);
    }
}

// Create payment history if needed
async function createPaymentHistoryIfNeeded(userId) {
    try {
        const result = await pool.query("SELECT * FROM payment_history WHERE UserID = $1", [userId]);
        if (result.rows.length === 0) {
            const date = new Date().toISOString().slice(0, 10);
            await pool.query("INSERT INTO payment_history (UserID, Amount, Date, Type, Description) VALUES ($1, 0, $2, 'Initial', 'Initial setup credit')", [userId, date]);
            console.log(`Payment history created for user ID ${userId}`);
        }
    } catch (err) {
        console.error("Error creating payment history:", err.message);
    }
}

// Cleanup past reservations
async function cleanupPastReservations() {
    const cleanupQuery = `
        BEGIN;

        -- Move checked-in reservations to the history table
        INSERT INTO reservation_history (UserID, ReservationID, CheckInDate)
        SELECT UserID, ReservationID, Date
        FROM reservations
        WHERE IsCheckedIn = true AND Date < CURRENT_DATE;

        -- Delete the moved reservations from the original table
        DELETE FROM reservations
        WHERE IsCheckedIn = true AND Date < CURRENT_DATE;

        -- Delete unchecked past reservations
        DELETE FROM reservations
        WHERE IsCheckedIn = false AND Date < CURRENT_DATE;

        -- Delete old lap swim schedules
        DELETE FROM lap_swim_schedules
        WHERE Date < CURRENT_DATE;

        COMMIT;
    `;

    try {
        await pool.query(cleanupQuery);
        console.log("Cleanup completed successfully.");
    } catch (err) {
        console.error("Error during cleanup:", err.message);
    }
}

module.exports = { initializeUsers, cleanupPastReservations, createTables }; // Export createTables here
