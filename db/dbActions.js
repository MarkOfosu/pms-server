const bcrypt = require('bcryptjs');
const db = require('./database');

function initializeUsers() {
    createAdminUser();
    createPublicUser();
    createActivityTypes();
    createLapSwimSchedules();
    ensureFinancialRecords();
}

function createAdminUser() {
    const userType = 1030; // Admin user type
    db.get("SELECT UserId FROM users WHERE UserType = ?", [userType], (err, user) => {
        if (err) {
            console.error("Error checking for admin user:", err.message);
            return;
        }
        if (!user) {
            const hashedPassword = bcrypt.hashSync(process.env.ADMIN_PASSWORD, 10);
            db.run("INSERT INTO users (UserName, Password, FirstName, LastName, Email, DateOfBirth, Address, JoinDate, UserType) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", [
                process.env.ADMIN_USERNAME,
                hashedPassword,
                process.env.ADMIN_FIRST_NAME,
                process.env.ADMIN_LAST_NAME,
                process.env.ADMIN_EMAIL,
                process.env.ADMIN_DATE_OF_BIRTH,
                process.env.ADMIN_ADDRESS,
                new Date().toISOString().slice(0, 10),
                userType
            ], function(err) {
                if (err) {
                    console.error("Error creating admin user:", err.message);
                } else {
                    console.log(`Admin user created with ID ${this.lastID}`);
                }
            });
        }
    });
}

function createPublicUser() {
    const userType = 1020; // Public user type
    db.get("SELECT UserId FROM users WHERE UserType = ?", [userType], (err, user) => {
        if (err) {
            console.error("Error checking for public user:", err.message);
            return;
        }
        if (!user) {
            const hashedPassword = bcrypt.hashSync(process.env.PUBLIC_PASSWORD, 10);
            db.run("INSERT INTO users (UserName, Password, FirstName, LastName, Email, DateOfBirth, Address, JoinDate, UserType) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", [
                process.env.PUBLIC_USERNAME,
                hashedPassword,
                process.env.PUBLIC_FIRST_NAME,
                process.env.PUBLIC_LAST_NAME,
                process.env.PUBLIC_EMAIL,
                process.env.PUBLIC_DATE_OF_BIRTH,
                process.env.PUBLIC_ADDRESS,
                new Date().toISOString().slice(0, 10),
                userType
            ], function(err) {
                if (err) {
                    console.error("Error creating public user:", err.message);
                } else {
                    console.log(`Public user created with ID ${this.lastID}`);
                }
            });
        }
    });
}

function createActivityTypes() {
    const activityTypes = ['Lap Swim', 'Aqua Aerobics', 'Swim Lessons', 'Family Swim', 'Swim Team', 'Water Polo'];
    activityTypes.forEach(activity => {
        db.get("SELECT ActivityID FROM activity_types WHERE ActivityName = ?", [activity], (err, exists) => {
            if (err) {
                console.error(`Error checking activity type ${activity}:`, err.message);
                return;
            }
            if (!exists) {
                db.run("INSERT INTO activity_types (ActivityName) VALUES (?)", [activity], function(err) {
                    if (err) {
                        console.error(`Error creating activity type ${activity}:`, err.message);
                    } else {
                        console.log(`Activity type ${activity} created with ID ${this.lastID}`);
                    }
                });
            }
        });
    });
}

function createLapSwimSchedules() {
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

    schedules.forEach(schedule => {
        db.get("SELECT ScheduleID FROM lap_swim_schedules WHERE Date = ? AND StartTime = ? AND EndTime = ?", [schedule.Date, schedule.StartTime, schedule.EndTime], (err, exists) => {
            if (err) {
                console.error("Error checking lap swim schedule:", err.message);
                return;
            }
            if (!exists) {
                db.run("INSERT INTO lap_swim_schedules (Date, StartTime, EndTime, LaneNumber, MaxSwimmers) VALUES (?, ?, ?, ?, ?)", [schedule.Date, schedule.StartTime, schedule.EndTime, schedule.LaneNumber, schedule.MaxSwimmers], function(err) {
                    if (err) {
                        console.error("Error creating lap swim schedule:", err.message);
                    } else {
                        console.log(`Lap swim schedule created with ID ${this.lastID}`);
                    }
                });
            }
        });
    });
}


function ensureFinancialRecords() {
    db.each("SELECT UserId FROM users", [], (err, row) => {
        if (err) {
            console.error("Error fetching users for financial records:", err.message);
            return;
        }
        createPaymentAccountIfNeeded(row.UserId);
        createPaymentHistoryIfNeeded(row.UserId);
    });
}

function createPaymentAccountIfNeeded(userId) {
    db.get("SELECT * FROM payment_account WHERE UserID = ?", [userId], (err, account) => {
        if (err) {
            console.error("Error checking payment account:", err.message);
            return;
        }
        if (!account) {
            db.run("INSERT INTO payment_account (UserID, AccountBalance, PaymentDue, AccountCredit, AccountDebit) VALUES (?, 0, 0, 0, 0)", [userId], function(err) {
                if (err) {
                    console.error("Error creating payment account:", err.message);
                } else {
                    console.log(`Payment account created for user ID ${userId}`);
                }
            });
        }
    });
}

function createPaymentHistoryIfNeeded(userId) {
    db.get("SELECT * FROM payment_history WHERE UserID = ?", [userId], (err, history) => {
        if (err) {
            console.error("Error checking payment history:", err.message);
            return;
        }
        if (!history) {
            const date = new Date().toISOString().slice(0, 10);
            db.run("INSERT INTO payment_history (UserID, Amount, Date, Type, Description) VALUES (?, 0, ?, 'Initial', 'Initial setup credit')", [userId, date], function(err) {
                if (err) {
                    console.error("Error creating payment history:", err.message);
                } else {
                    console.log(`Payment history created for user ID ${userId}`);
                }
            });
        }
    });
}

function cleanupPastReservations() {
    const cleanupQuery = `
        BEGIN TRANSACTION;

        -- Move checked-in reservations to the history table
        INSERT INTO reservation_history (UserID, ReservationID, CheckInDate)
        SELECT UserID, ReservationID, Date
        FROM reservations
        WHERE IsCheckedIn = 1 AND Date < CURRENT_DATE;

        -- Delete the moved reservations from the original table
        DELETE FROM reservations
        WHERE IsCheckedIn = 1 AND Date < CURRENT_DATE;

        -- Delete unchecked past reservations
        DELETE FROM reservations
        WHERE IsCheckedIn = 0 AND Date < CURRENT_DATE;

        -- Delete old lap swim schedules
        DELETE FROM lap_swim_schedules
        WHERE Date < CURRENT_DATE;

        COMMIT;
    `;

    db.run(cleanupQuery, function(err) {
        if (err) {
            console.error("Error during cleanup:", err.message);
            db.run("ROLLBACK;");
        } else {
            console.log("Cleanup completed successfully.");
        }
    });
}


module.exports = { initializeUsers, cleanupPastReservations };
