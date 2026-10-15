const { body, param, query, validationResult } = require("express-validator");
const mongoose = require("mongoose");

// @desc    Handle validation errors
exports.handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.param,
      message: error.msg,
      value: error.value
    }));

    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errorMessages
    });
  }

  next();
};

// @desc    Validate MongoDB ObjectId
exports.validateObjectId = (paramName) => {
  return [
    param(paramName)
      .isMongoId()
      .withMessage("Invalid ID format"),
    exports.handleValidationErrors
  ];
};

// @desc    Validate pagination query params
exports.validatePagination = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),
  exports.handleValidationErrors
];

// @desc    User validation rules
exports.validateUser = {
  register: [
    body("name")
      .trim()
      .notEmpty()
      .withMessage("Name is required")
      .isLength({ min: 2, max: 100 })
      .withMessage("Name must be between 2 and 100 characters"),
    
    body("email")
      .trim()
      .notEmpty()
      .withMessage("Email is required")
      .isEmail()
      .withMessage("Please enter a valid email")
      .normalizeEmail(),
    
    body("password")
      .notEmpty()
      .withMessage("Password is required")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters")
      .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{6,}$/)
      .withMessage("Password must contain at least one uppercase letter, one lowercase letter, and one number"),
    
    body("studentId")
      .trim()
      .notEmpty()
      .withMessage("Student ID is required")
      .isLength({ min: 3, max: 20 })
      .withMessage("Student ID must be between 3 and 20 characters"),
    
    body("department")
      .trim()
      .notEmpty()
      .withMessage("Department is required")
      .isLength({ min: 2, max: 100 })
      .withMessage("Department must be between 2 and 100 characters"),
    
    body("year")
      .trim()
      .notEmpty()
      .withMessage("Year is required")
      .isIn(["First", "Second", "Third", "Fourth", "Fifth", "Graduated"])
      .withMessage("Invalid year value"),
    
    body("phone")
      .optional()
      .trim()
      .matches(/^[0-9]{10}$/)
      .withMessage("Phone must be 10 digits"),
    
    exports.handleValidationErrors
  ],

  login: [
    body("email")
      .trim()
      .notEmpty()
      .withMessage("Email is required")
      .isEmail()
      .withMessage("Please enter a valid email"),
    
    body("password")
      .notEmpty()
      .withMessage("Password is required"),
    
    exports.handleValidationErrors
  ],

  update: [
    body("name")
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage("Name must be between 2 and 100 characters"),
    
    body("phone")
      .optional()
      .trim()
      .matches(/^[0-9]{10}$/)
      .withMessage("Phone must be 10 digits"),
    
    body("address")
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage("Address cannot exceed 500 characters"),
    
    body("bio")
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage("Bio cannot exceed 500 characters"),
    
    body("profileImage")
      .optional()
      .trim()
      .isURL()
      .withMessage("Profile image must be a valid URL"),
    
    exports.handleValidationErrors
  ],

  updatePassword: [
    body("currentPassword")
      .notEmpty()
      .withMessage("Current password is required"),
    
    body("newPassword")
      .notEmpty()
      .withMessage("New password is required")
      .isLength({ min: 6 })
      .withMessage("New password must be at least 6 characters")
      .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{6,}$/)
      .withMessage("New password must contain at least one uppercase letter, one lowercase letter, and one number"),
    
    exports.handleValidationErrors
  ],

  adminUpdate: [
    body("role")
      .optional()
      .isIn(["admin", "member"])
      .withMessage("Role must be either 'admin' or 'member'"),
    
    body("status")
      .optional()
      .isIn(["Active", "Inactive", "Suspended", "Graduated"])
      .withMessage("Invalid status value"),
    
    body("activeness")
      .optional()
      .isInt({ min: 0, max: 100 })
      .withMessage("Activeness must be between 0 and 100"),
    
    exports.handleValidationErrors
  ]
};

// @desc    Course validation rules
exports.validateCourse = {
  create: [
    body("title")
      .trim()
      .notEmpty()
      .withMessage("Title is required")
      .isLength({ min: 5, max: 200 })
      .withMessage("Title must be between 5 and 200 characters"),
    
    body("description")
      .trim()
      .notEmpty()
      .withMessage("Description is required")
      .isLength({ min: 20 })
      .withMessage("Description must be at least 20 characters"),
    
    body("category")
      .trim()
      .notEmpty()
      .withMessage("Category is required")
      .isIn(["Training", "Academic", "Leadership", "Technical", "General", "NCC"])
      .withMessage("Invalid category"),
    
    body("level")
      .optional()
      .isIn(["Beginner", "Intermediate", "Advanced", "All Levels"])
      .withMessage("Invalid level"),
    
    body("tags")
      .optional()
      .isArray()
      .withMessage("Tags must be an array"),
    
    body("content")
      .trim()
      .notEmpty()
      .withMessage("Content is required"),
    
    body("duration")
      .optional()
      .isInt({ min: 0 })
      .withMessage("Duration must be a positive number"),
    
    body("isPublished")
      .optional()
      .isBoolean()
      .withMessage("isPublished must be a boolean"),
    
    body("isFeatured")
      .optional()
      .isBoolean()
      .withMessage("isFeatured must be a boolean"),
    
    body("isFree")
      .optional()
      .isBoolean()
      .withMessage("isFree must be a boolean"),
    
    body("price")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Price must be a positive number"),
    
    exports.handleValidationErrors
  ],

  update: [
    body("title")
      .optional()
      .trim()
      .isLength({ min: 5, max: 200 })
      .withMessage("Title must be between 5 and 200 characters"),
    
    body("description")
      .optional()
      .trim()
      .isLength({ min: 20 })
      .withMessage("Description must be at least 20 characters"),
    
    body("category")
      .optional()
      .isIn(["Training", "Academic", "Leadership", "Technical", "General", "NCC"])
      .withMessage("Invalid category"),
    
    exports.handleValidationErrors
  ],

  rating: [
    body("rating")
      .isInt({ min: 1, max: 5 })
      .withMessage("Rating must be between 1 and 5"),
    
    body("review")
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage("Review cannot exceed 500 characters"),
    
    exports.handleValidationErrors
  ]
};

// @desc    Attendance validation rules
exports.validateAttendance = {
  create: [
    body("user")
      .optional()
      .isMongoId()
      .withMessage("Invalid user ID"),
    
    body("userId")
      .optional()
      .isMongoId()
      .withMessage("Invalid user ID"),
    
    body("event")
      .optional()
      .isMongoId()
      .withMessage("Invalid event ID"),
    
    body("eventId")
      .optional()
      .isMongoId()
      .withMessage("Invalid event ID"),
    
    body("eventName")
      .trim()
      .notEmpty()
      .withMessage("Event name is required")
      .isLength({ max: 200 })
      .withMessage("Event name cannot exceed 200 characters"),
    
    body("eventType")
      .optional()
      .isIn(["Training", "Meeting", "Camp", "Competition", "Drill", "Other"])
      .withMessage("Invalid event type"),
    
    body("date")
      .optional()
      .isISO8601()
      .withMessage("Date must be in ISO format"),
    
    body("status")
      .optional()
      .isIn(["Present", "Absent", "Late", "Excused", "Half Day"])
      .withMessage("Invalid status"),
    
    body("location")
      .optional()
      .trim()
      .isLength({ max: 200 })
      .withMessage("Location cannot exceed 200 characters"),
    
    body("performanceScore")
      .optional()
      .isInt({ min: 0, max: 10 })
      .withMessage("Performance score must be between 0 and 10"),
    
    exports.handleValidationErrors
  ],

  bulkCreate: [
    body("users")
      .isArray({ min: 1 })
      .withMessage("Users array is required and must not be empty"),
    
    body("users.*")
      .isMongoId()
      .withMessage("Invalid user ID in users array"),
    
    body("eventName")
      .trim()
      .notEmpty()
      .withMessage("Event name is required"),
    
    body("eventType")
      .optional()
      .isIn(["Training", "Meeting", "Camp", "Competition", "Drill", "Other"])
      .withMessage("Invalid event type"),
    
    body("date")
      .optional()
      .isISO8601()
      .withMessage("Date must be in ISO format"),
    
    body("status")
      .optional()
      .isIn(["Present", "Absent", "Late", "Excused", "Half Day"])
      .withMessage("Invalid status"),
    
    exports.handleValidationErrors
  ]
};

// @desc    Achievement validation rules
exports.validateAchievement = {
  create: [
    body("user")
      .optional()
      .isMongoId()
      .withMessage("Invalid user ID"),
    
    body("title")
      .trim()
      .notEmpty()
      .withMessage("Title is required")
      .isLength({ max: 200 })
      .withMessage("Title cannot exceed 200 characters"),
    
    body("description")
      .trim()
      .notEmpty()
      .withMessage("Description is required")
      .isLength({ min: 20 })
      .withMessage("Description must be at least 20 characters"),
    
    body("category")
      .optional()
      .isIn(["Sports", "Academic", "Leadership", "Cultural", "NCC", "Community", "Technical", "Other"])
      .withMessage("Invalid category"),
    
    body("level")
      .optional()
      .isIn(["College", "University", "State", "National", "International"])
      .withMessage("Invalid level"),
    
    body("date")
      .notEmpty()
      .withMessage("Date is required")
      .isISO8601()
      .withMessage("Date must be in ISO format"),
    
    body("venue")
      .optional()
      .trim()
      .isLength({ max: 200 })
      .withMessage("Venue cannot exceed 200 characters"),
    
    body("organizer")
      .optional()
      .trim()
      .isLength({ max: 200 })
      .withMessage("Organizer cannot exceed 200 characters"),
    
    body("evidence")
      .optional()
      .isArray()
      .withMessage("Evidence must be an array"),
    
    body("evidence.*")
      .optional()
      .isString()
      .withMessage("Evidence items must be strings"),
    
    body("points")
      .optional()
      .isInt({ min: 0 })
      .withMessage("Points must be a positive integer"),
    
    body("isPublic")
      .optional()
      .isBoolean()
      .withMessage("isPublic must be a boolean"),
    
    exports.handleValidationErrors
  ],

  verify: [
    body("verified")
      .optional()
      .isBoolean()
      .withMessage("Verified must be a boolean"),
    
    body("notes")
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage("Notes cannot exceed 500 characters"),
    
    exports.handleValidationErrors
  ],

  comment: [
    body("text")
      .trim()
      .notEmpty()
      .withMessage("Comment text is required")
      .isLength({ max: 500 })
      .withMessage("Comment cannot exceed 500 characters"),
    
    exports.handleValidationErrors
  ]
};

// @desc    Event validation rules
exports.validateEvent = {
  create: [
    body("title")
      .trim()
      .notEmpty()
      .withMessage("Title is required")
      .isLength({ max: 200 })
      .withMessage("Title cannot exceed 200 characters"),
    
    body("description")
      .trim()
      .notEmpty()
      .withMessage("Description is required")
      .isLength({ min: 20 })
      .withMessage("Description must be at least 20 characters"),
    
    body("type")
      .optional()
      .isIn(["Training", "Meeting", "Camp", "Competition", "Workshop", "Seminar", "Social", "Other"])
      .withMessage("Invalid event type"),
    
    body("category")
      .optional()
      .isIn(["Mandatory", "Optional", "Special", "Regular"])
      .withMessage("Invalid category"),
    
    body("startDate")
      .notEmpty()
      .withMessage("Start date is required")
      .isISO8601()
      .withMessage("Start date must be in ISO format"),
    
    body("endDate")
      .notEmpty()
      .withMessage("End date is required")
      .isISO8601()
      .withMessage("End date must be in ISO format")
      .custom((value, { req }) => {
        if (new Date(value) < new Date(req.body.startDate)) {
          throw new Error("End date must be after start date");
        }
        return true;
      }),
    
    body("startTime")
      .notEmpty()
      .withMessage("Start time is required")
      .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
      .withMessage("Start time must be in HH:MM format"),
    
    body("endTime")
      .notEmpty()
      .withMessage("End time is required")
      .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
      .withMessage("End time must be in HH:MM format"),
    
    body("location")
      .trim()
      .notEmpty()
      .withMessage("Location is required")
      .isLength({ max: 200 })
      .withMessage("Location cannot exceed 200 characters"),
    
    body("venue")
      .optional()
      .trim()
      .isLength({ max: 200 })
      .withMessage("Venue cannot exceed 200 characters"),
    
    body("maxAttendees")
      .optional()
      .isInt({ min: 0 })
      .withMessage("Max attendees must be a positive integer"),
    
    body("uniformRequired")
      .optional()
      .isBoolean()
      .withMessage("uniformRequired must be a boolean"),
    
    body("isRecurring")
      .optional()
      .isBoolean()
      .withMessage("isRecurring must be a boolean"),
    
    body("status")
      .optional()
      .isIn(["Draft", "Published", "Ongoing", "Completed", "Cancelled", "Postponed"])
      .withMessage("Invalid status"),
    
    body("isPublic")
      .optional()
      .isBoolean()
      .withMessage("isPublic must be a boolean"),
    
    exports.handleValidationErrors
  ],

  feedback: [
    body("rating")
      .isInt({ min: 1, max: 5 })
      .withMessage("Rating must be between 1 and 5"),
    
    body("comment")
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage("Comment cannot exceed 500 characters"),
    
    exports.handleValidationErrors
  ]
};

// @desc    File upload validation
exports.validateFileUpload = (allowedTypes = [], maxSizeMB = 10) => {
  return [
    body("file").custom((value, { req }) => {
      if (!req.file) {
        throw new Error("File is required");
      }

      // Check file type
      if (allowedTypes.length > 0 && !allowedTypes.includes(req.file.mimetype)) {
        throw new Error(`File type not allowed. Allowed types: ${allowedTypes.join(", ")}`);
      }

      // Check file size
      const maxSize = maxSizeMB * 1024 * 1024;
      if (req.file.size > maxSize) {
        throw new Error(`File size must be less than ${maxSizeMB}MB`);
      }

      return true;
    }),
    exports.handleValidationErrors
  ];
};

// @desc    Search query validation
exports.validateSearch = [
  query("search")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Search term must be between 2 and 100 characters"),
  
  query("sortBy")
    .optional()
    .matches(/^[a-zA-Z]+:(asc|desc)$/)
    .withMessage("sortBy must be in format 'field:direction' (asc or desc)"),
  
  exports.handleValidationErrors
];

// @desc    Date range validation
exports.validateDateRange = [
  query("startDate")
    .optional()
    .isISO8601()
    .withMessage("Start date must be in ISO format"),
  
  query("endDate")
    .optional()
    .isISO8601()
    .withMessage("End date must be in ISO format")
    .custom((value, { req }) => {
      if (req.query.startDate && value && new Date(value) < new Date(req.query.startDate)) {
        throw new Error("End date must be after start date");
      }
      return true;
    }),
  
  exports.handleValidationErrors
];