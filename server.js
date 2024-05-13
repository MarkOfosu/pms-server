const express = require('express'); 
const cors = require('cors'); 
const bodyParser = require('body-parser'); 
const authRoutes = require('./routes/authRoutes');
const authenticateToken = require('./middleware/authenticateToken'); 
const cookieParser = require('cookie-parser');
const path = require('path');

require('dotenv').config(); 

const app = express(); 

app.use(bodyParser.json()); 
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const corsOptions = {
    origin: ['http://localhost:3000', 'http://api.pool-ms.com'],
    credentials: true,
    optionsSuccessStatus: 200
};


app.use(cors(corsOptions));
app.use('/api/auth', authRoutes);


const port = process.env.PORT || 80;

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
