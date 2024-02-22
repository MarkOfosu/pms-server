// multerConfig.js
const multer = require('multer');
const path = require('path');

// Configure storage
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    // Upload files to the 'uploads' directory
    cb(null, 'uploads/');
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