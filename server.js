const express = require('express'); 
const cors = require('cors'); 
const bodyParser = require('body-parser'); 
const authRoutes = require('./routes/authRoutes');
const authenticateToken = require('./middleware/authenticateToken'); 

require('dotenv').config(); 

const app = express(); 

app.use(bodyParser.json()); 
app.use(bodyParser.urlencoded({ extended: true }));

const corsOptions = {
    origin:'localhost:3000' , 
    credentials: true, 
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use('/api/auth', authRoutes);

const port = process.env.PORT || 5001;

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
