const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const authRoutes = require('./routes/authRoutes');
const cookieParser = require('cookie-parser');
const cron = require('node-cron');
const path = require('path');
const db = require('./db/database');
const { cleanupPastReservations, initializeUsers } = require('./db/dbActions');
require('dotenv').config();

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use('src/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, '..', 'public')));

app.use(cors());

app.use('/api/auth', authRoutes);

app.get('/*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

const performCleanup = () => {
    cleanupPastReservations(); 
};

// Schedule the cleanup job to run every hour
cron.schedule('0 * * * *', performCleanup, {
    scheduled: true,
    timezone: 'America/Los_Angeles'
});

const port = process.env.PORT || 5001;

app.listen(port, () => {
    initializeUsers();

    cleanupPastReservations();
    console.log(`Server is running on port ${port}`);
});
