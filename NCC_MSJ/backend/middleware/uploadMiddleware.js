const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

// Ensure upload directory exists
const createUploadDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// Generate unique filename
const generateFilename = (file) => {
  const timestamp = Date.now();
  const randomString = crypto.randomBytes(8).toString("hex");
  const extension = path.extname(file.originalname).toLowerCase();
  return `${timestamp}-${randomString}${extension}`;
};

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = "uploads/";
    
    // Determine upload path based on file type
    if (file.mimetype.startsWith("image/")) {
      uploadPath += "images/";
    } else if (file.mimetype.startsWith("video/")) {
      uploadPath += "videos/";
    } else if (file.mimetype.includes("pdf")) {
      uploadPath += "documents/pdf/";
    } else if (file.mimetype.includes("word") || file.mimetype.includes("document")) {
      uploadPath += "documents/word/";
    } else if (file.mimetype.includes("excel") || file.mimetype.includes("spreadsheet")) {
      uploadPath += "documents/excel/";
    } else if (file.mimetype.includes("presentation") || file.mimetype.includes("powerpoint")) {
      uploadPath += "documents/presentations/";
    } else {
      uploadPath += "others/";
    }
    
    // Create directory if it doesn't exist
    createUploadDir(uploadPath);
    cb(null, uploadPath);
  },
  
  filename: (req, file, cb) => {
    const filename = generateFilename(file);
    cb(null, filename);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowedImageTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
  const allowedVideoTypes = ["video/mp4", "video/mpeg", "video/ogg", "video/webm"];
  const allowedDocumentTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation"
  ];
  
  const allowedTypes = [...allowedImageTypes, ...allowedVideoTypes, ...allowedDocumentTypes];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} is not allowed`), false);
  }
};

// Multer configuration
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 5 // Maximum 5 files
  }
});

// @desc    Single file upload middleware
exports.uploadSingle = (fieldName) => {
  return (req, res, next) => {
    const uploadMiddleware = upload.single(fieldName);
    
    uploadMiddleware(req, res, (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === "LIMIT_FILE_SIZE") {
            return res.status(400).json({
              success: false,
              message: "File size must be less than 10MB"
            });
          }
          if (err.code === "LIMIT_FILE_COUNT") {
            return res.status(400).json({
              success: false,
              message: "Too many files"
            });
          }
        }
        
        return res.status(400).json({
          success: false,
          message: err.message
        });
      }
      
      // Add file information to request body
      if (req.file) {
        req.body[fieldName] = {
          filename: req.file.filename,
          originalname: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size,
          path: req.file.path,
          url: `/uploads/${req.file.filename}`
        };
      }
      
      next();
    });
  };
};

// @desc    Multiple files upload middleware
exports.uploadMultiple = (fieldName, maxCount = 5) => {
  return (req, res, next) => {
    const uploadMiddleware = upload.array(fieldName, maxCount);
    
    uploadMiddleware(req, res, (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === "LIMIT_FILE_SIZE") {
            return res.status(400).json({
              success: false,
              message: "File size must be less than 10MB"
            });
          }
          if (err.code === "LIMIT_FILE_COUNT") {
            return res.status(400).json({
              success: false,
              message: `Maximum ${maxCount} files allowed`
            });
          }
        }
        
        return res.status(400).json({
          success: false,
          message: err.message
        });
      }
      
      // Add files information to request body
      if (req.files && req.files.length > 0) {
        req.body[fieldName] = req.files.map(file => ({
          filename: file.filename,
          originalname: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          path: file.path,
          url: `/uploads/${file.filename}`
        }));
      }
      
      next();
    });
  };
};

// @desc    Profile picture upload middleware
exports.uploadProfilePicture = exports.uploadSingle("profileImage");

// @desc    Course thumbnail upload middleware
exports.uploadCourseThumbnail = exports.uploadSingle("thumbnail");

// @desc    Achievement evidence upload middleware
exports.uploadAchievementEvidence = exports.uploadMultiple("evidence", 3);

// @desc    Course attachments upload middleware
exports.uploadCourseAttachments = exports.uploadMultiple("attachments", 5);

// @desc    Event banner upload middleware
exports.uploadEventBanner = exports.uploadSingle("bannerImage");

// @desc    Delete file utility
exports.deleteFile = (filePath) => {
  return new Promise((resolve, reject) => {
    if (!filePath) {
      return resolve();
    }
    
    const fullPath = path.join(__dirname, "..", filePath);
    
    fs.unlink(fullPath, (err) => {
      if (err) {
        // If file doesn't exist, it's okay
        if (err.code === "ENOENT") {
          return resolve();
        }
        return reject(err);
      }
      resolve();
    });
  });
};

// @desc    Serve uploaded files
exports.serveUploadedFiles = (req, res, next) => {
  const filePath = req.params[0];
  const fullPath = path.join(__dirname, "../uploads", filePath);
  
  // Security check: prevent directory traversal
  const normalizedPath = path.normalize(fullPath);
  if (!normalizedPath.startsWith(path.join(__dirname, "../uploads"))) {
    return res.status(403).json({
      success: false,
      message: "Access denied"
    });
  }
  
  // Check if file exists
  fs.access(fullPath, fs.constants.F_OK, (err) => {
    if (err) {
      return res.status(404).json({
        success: false,
        message: "File not found"
      });
    }
    
    // Set appropriate headers
    const ext = path.extname(fullPath).toLowerCase();
    const mimeTypes = {
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".gif": "image/gif",
      ".webp": "image/webp",
      ".pdf": "application/pdf",
      ".doc": "application/msword",
      ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ".xls": "application/vnd.ms-excel",
      ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ".ppt": "application/vnd.ms-powerpoint",
      ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      ".mp4": "video/mp4",
      ".mp3": "audio/mpeg"
    };
    
    const contentType = mimeTypes[ext] || "application/octet-stream";
    res.setHeader("Content-Type", contentType);
    
    // Stream the file
    const stream = fs.createReadStream(fullPath);
    stream.pipe(res);
  });
};