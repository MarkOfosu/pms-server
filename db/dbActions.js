const bcrypt = require('bcryptjs');

function initializeUsers(db) {
    createAdminUser(db);
    createPublicUser(db);
    ensureFinancialRecords(db);
}

function createAdminUser(db) {
    const userType = 1030; // Admin user type
    const hashedPassword = bcrypt.hashSync(process.env.ADMIN_PASSWORD, 10);
    db.get("SELECT UserId FROM users WHERE UserType = ?", [userType], (err, user) => {
        if (err) {
            console.error("Error checking for admin user:", err.message);
            return;
        }
        if (!user) {
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

function createPublicUser(db) {
    const userType = 1020; // Public user type
    const password = process.env.PUBLIC_PASSWORD;

    if (!password) {
        console.error("Public user password not set in environment variables.");
        return;
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    db.get("SELECT UserId FROM users WHERE UserType = ?", [userType], (err, user) => {
        if (err) {
            console.error("Error checking for public user:", err.message);
            return;
        }
        if (!user) {
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
        } else {
            console.log("Public user already exists.");
        }
    });
}



function ensureFinancialRecords(db) {
    db.each("SELECT UserId FROM users", [], (err, row) => {
        if (err) {
            console.error("Error fetching users for financial records:", err.message);
            return;
        }
        createPaymentAccountIfNeeded(db, row.UserId);
        createPaymentHistoryIfNeeded(db, row.UserId);
    });
}

function createPaymentAccountIfNeeded(db, userId) {
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

function createPaymentHistoryIfNeeded(db, userId) {
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

module.exports = {
    initializeUsers
};
