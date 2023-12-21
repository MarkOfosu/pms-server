//server.js
const express = require('express'); 
const cors = require('cors'); 
const bodyParser = require('body-parser'); 
const authRoutes = require('./routes/authRoutes');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);


require('dotenv').config(); 

const app = express(); 


app.use(bodyParser.json()); 
app.use(bodyParser.urlencoded({extended: true}));

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        secure: process.env.NODE_ENV === "production", // Set to true in a production environment with HTTPS
        httpOnly: true
    }
})); 




const corsOptions = {
    origin: '*',
    credentials: true, 
    optionsSuccessStatus: 200
}


app.use(cors(corsOptions));
app.use('/api/auth', authRoutes);
const port = process.env.PORT || 5001;


app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});


