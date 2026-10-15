const multer = require('multer');
const AppError = require('../utils/AppError');
const { isAllowedFile, maxFileSize, maxFiles } = require('../services/fileStorage');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: maxFileSize(),
    files: maxFiles(),
  },
  fileFilter(req, file, callback) {
    if (!isAllowedFile(file.mimetype, file.originalname)) {
      callback(new AppError(400, 'This file type is not allowed'));
      return;
    }

    callback(null, true);
  },
});

module.exports = { upload };
