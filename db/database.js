//server/db/database.js

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');

const dbPath = path.resolve(__dirname, 'db.sqlite');
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
        Id INTEGER PRIMARY KEY AUTOINCREMENT,
        First_name TEXT NOT NULL,
        Last_name TEXT NOT NULL,
        Email_address TEXT NOT NULL UNIQUE,
        hashed_password TEXT NOT NULL
    )`);
    if (err) {
        return console.error(err.message);
    }
        console.log('Connected to the database.');

        // create admin user if it doesn't already exist
        db.get("SELECT * FROM users WHERE Email_address = ?", ['admin@gmail.com'], (err, user) => {
            if (err) {
                return console.error(err.message);
            }
            if (!user) {
                const hashedPassword = bcrypt.hashSync('Go!', 10);
                db.run(`INSERT INTO users (First_name,Last_name,Email_address,hashed_password) VALUES (?, ?,?,?)`, ['admin', 'admin', 'admin@gmail.com', hashedPassword], function (err) {
                    if (err) {
                        return console.error(err.message);
                    }
                    console.log(`Admin user created with id ${this.lastID}`);
                });
            }
        });



       
});
    

module.exports = db;
