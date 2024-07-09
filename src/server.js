require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const authRoutes = require('./routes/authRoutes');
const cookieParser = require('cookie-parser');
const cron = require('node-cron');
const path = require('path');
const { cleanupPastReservations, initializeUsers, createTables } = require('./db/dbActions'); // Import createTables

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use('/uploads', express.static(path.join(__dirname, 'src/uploads')));
app.use(express.static(path.join(__dirname, '..', 'public')));

app.use(cors());

app.use('/api/auth', authRoutes);

app.get('/*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

const performCleanup = async () => {
    try {
        await cleanupPastReservations();
    } catch (err) {
        console.error('Error during scheduled cleanup:', err);
    }
};

// Schedule the cleanup job to run every hour
cron.schedule('0 * * * *', performCleanup, {
    scheduled: true,
    timezone: 'America/Los_Angeles'
});

const port = process.env.PORT || 5000;

const startServer = async () => {
    try {
        await createTables(); 
        await initializeUsers(); 
        console.log('Initialization completed successfully.');
        
        await cleanupPastReservations();
        console.log('Initial cleanup completed successfully.');
        
        app.listen(port, () => {
            console.log(`Server is running on port ${port}`);
        });
    } catch (err) {
        console.error('Error during server initialization:', err);
    }
};

startServer();
