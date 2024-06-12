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
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// CORS configuration
const corsOptions = {
    origin: [
        'http://pool-ms.com',
        'http://www.pool-ms.com',
        'https://pool-ms.com',
        'https://www.pool-ms.com',
        'http://localhost',
        'http://192.168.1.153',
        'http://192.168.1.153:32778',
        'http://192.168.1.153:32793'
    ],
    credentials: true,
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));  // Preflight requests

app.use('/api/auth', authRoutes);

const performCleanup = () => {
    cleanupPastReservations(); 
};

// Schedule the cleanup job to run every hour
cron.schedule('0 * * * *', performCleanup, {
    scheduled: true,
    timezone: 'America/Los_Angeles'
});

const port = process.env.PORT || 80;

app.listen(port, () => {
    initializeUsers();
    console.log(`Server is running on port ${port}`);
});
