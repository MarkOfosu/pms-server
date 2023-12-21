// middleware/auth.js

const verifyLogin = (req, res, next) => {
    if (!req.session.userId) {
        return res.status(401).send("Unauthorized");
    }
    next();
};

// Use verifyLogin middleware in protected routes





// const jwt = require('jsonwebtoken');

// const verifyToken = (req, res, next) => {
//     const token = req.session.token;

//     if (!token) {
//         return res.status(403).send("A token is required for authentication");
//     }

//     try {
//         const decoded = jwt.verify(token, process.env.JWT_SECRET);
//         req.user = decoded;
//     } catch (err) {
//         return res.status(401).send("Invalid Token");
//     }
//     return next();
// };

module.exports = verifyLogin;
