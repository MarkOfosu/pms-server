// multerConfig.js
const multer = require('multer');
const path = require('path');

// Configure storage
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    // Save uploaded files to the 'uploads' directory and push it to user's table in the database
    cb(null, path.resolve(__dirname, '../uploads'));
  },
  filename: function(req, file, cb) {
    // Generate a unique filename for the uploaded file
    console.log(file);
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

// Export the configured multer instance
const upload = multer({ storage: storage });
module.exports = upload;
