const Course = require("../models/course.model");
const User = require("../models/User.model");
const AuditLog = require("../models/AuditLog.model");

// @desc    Get all courses
// @route   GET /api/courses
// @access  Public/Private (depending on course visibility)
exports.getCourses = async (req, res) => {
  try {
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build filter
    const filter = {};
    
    // Only show published courses to non-admins
    if (req.user?.role !== "admin") {
      filter.isPublished = true;
    }

    // Apply filters
    if (req.query.category) filter.category = req.query.category;
    if (req.query.level) filter.level = req.query.level;
    if (req.query.isFeatured) filter.isFeatured = req.query.isFeatured === "true";
    if (req.query.isFree) filter.isFree = req.query.isFree === "true";
    if (req.query.createdBy) filter.createdBy = req.query.createdBy;
    
    // Search
    if (req.query.search) {
      filter.$or = [
        { title: { $regex: req.query.search, $options: "i" } },
        { description: { $regex: req.query.search, $options: "i" } },
        { tags: { $regex: req.query.search, $options: "i" } }
      ];
    }

    // Sorting
    let sort = {};
    if (req.query.sortBy) {
      const parts = req.query.sortBy.split(":");
      sort[parts[0]] = parts[1] === "desc" ? -1 : 1;
    } else {
      sort.createdAt = -1;
    }

    // Execute query
    const courses = await Course.find(filter)
      .skip(skip)
      .limit(limit)
      .sort(sort)
      .populate("createdBy", "name email")
      .lean();

    // Check enrollment status for logged-in users
    if (req.user) {
      for (const course of courses) {
        course.isEnrolled = course.enrolledStudents?.some(
          student => student.toString() === req.user.id
        );
        course.isCompleted = course.completedBy?.some(
          completion => completion.user?.toString() === req.user.id
        );
        
        // Remove sensitive data
        delete course.enrolledStudents;
        delete course.completedBy;
      }
    }

    const total = await Course.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: courses.length,
      total,
      pagination: {
        page,
        limit,
        pages: Math.ceil(total / limit),
        next: page * limit < total ? page + 1 : null,
        prev: page > 1 ? page - 1 : null
      },
      data: courses
    });
  } catch (error) {
    console.error("Get courses error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch courses"
    });
  }
};

// @desc    Get single course
// @route   GET /api/courses/:id
// @access  Public/Private
exports.getCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate("createdBy", "name email profileImage")
      .populate("ratings.user", "name profileImage")
      .lean();

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found"
      });
    }

    // Check if user can access (published or admin/creator)
    if (!course.isPublished && 
        req.user?.role !== "admin" && 
        req.user?.id !== course.createdBy?._id?.toString()) {
      return res.status(403).json({
        success: false,
        message: "Course is not published"
      });
    }

    // Check enrollment and completion for logged-in users
    if (req.user) {
      course.isEnrolled = course.enrolledStudents?.some(
        student => student.toString() === req.user.id
      );
      course.isCompleted = course.completedBy?.some(
        completion => completion.user?.toString() === req.user.id
      );
      
      // Check if user has rated
      course.userRating = course.ratings?.find(
        rating => rating.user?._id?.toString() === req.user.id
      );
    }

    // Remove sensitive data
    delete course.enrolledStudents;
    delete course.completedBy;

    // Increment views
    await Course.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });

    res.status(200).json({
      success: true,
      data: course
    });
  } catch (error) {
    console.error("Get course error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch course"
    });
  }
};

// @desc    Create course (Admin/Instructor only)
// @route   POST /api/courses
// @access  Private/Admin
exports.createCourse = async (req, res) => {
  try {
    // Add createdBy from authenticated user
    const courseData = {
      ...req.body,
      createdBy: req.user.id
    };

    const course = await Course.create(courseData);

    // Log the action
    await AuditLog.log({
      userId: req.user.id,
      action: "create",
      resource: "Course",
      resourceId: course._id,
      resourceName: course.title,
      changes: {
        after: {
          title: course.title,
          category: course.category,
          isPublished: course.isPublished
        }
      },
      ipAddress: req.ip,
      userAgent: req.get("user-agent")
    });

    res.status(201).json({
      success: true,
      message: "Course created successfully",
      data: course
    });
  } catch (error) {
    console.error("Create course error:", error);
    
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: messages.join(", ")
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to create course"
    });
  }
};

// @desc    Update course
// @route   PUT /api/courses/:id
// @access  Private/Admin
exports.updateCourse = async (req, res) => {
  try {
    let course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found"
      });
    }

    // Check permissions (admin or creator)
    if (req.user.role !== "admin" && req.user.id !== course.createdBy.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this course"
      });
    }

    // Store old data for audit
    const oldData = {
      title: course.title,
      category: course.category,
      isPublished: course.isPublished,
      isFeatured: course.isFeatured
    };

    // Update course
    course = await Course.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    ).populate("createdBy", "name email");

    // Log the action
    await AuditLog.log({
      userId: req.user.id,
      action: "update",
      resource: "Course",
      resourceId: course._id,
      resourceName: course.title,
      changes: {
        before: oldData,
        after: {
          title: course.title,
          category: course.category,
          isPublished: course.isPublished,
          isFeatured: course.isFeatured
        },
        fields: Object.keys(req.body)
      },
      ipAddress: req.ip,
      userAgent: req.get("user-agent")
    });

    res.status(200).json({
      success: true,
      message: "Course updated successfully",
      data: course
    });
  } catch (error) {
    console.error("Update course error:", error);
    
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: messages.join(", ")
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to update course"
    });
  }
};

// @desc    Delete course
// @route   DELETE /api/courses/:id
// @access  Private/Admin
exports.deleteCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found"
      });
    }

    // Check permissions (admin or creator)
    if (req.user.role !== "admin" && req.user.id !== course.createdBy.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this course"
      });
    }

    // Store data for audit
    const courseData = {
      title: course.title,
      createdBy: course.createdBy
    };

    // Delete course
    await course.deleteOne();

    // Log the action
    await AuditLog.log({
      userId: req.user.id,
      action: "delete",
      resource: "Course",
      resourceId: course._id,
      resourceName: course.title,
      changes: {
        before: courseData
      },
      ipAddress: req.ip,
      userAgent: req.get("user-agent")
    });

    res.status(200).json({
      success: true,
      message: "Course deleted successfully",
      data: {}
    });
  } catch (error) {
    console.error("Delete course error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete course"
    });
  }
};

// @desc    Enroll in course
// @route   POST /api/courses/:id/enroll
// @access  Private
exports.enrollInCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found"
      });
    }

    // Check if course is published
    if (!course.isPublished) {
      return res.status(400).json({
        success: false,
        message: "Course is not available for enrollment"
      });
    }

    // Check if already enrolled
    const isEnrolled = course.enrolledStudents.some(
      student => student.toString() === req.user.id
    );

    if (isEnrolled) {
      return res.status(400).json({
        success: false,
        message: "Already enrolled in this course"
      });
    }

    // Enroll user
    await course.addEnrollment(req.user.id);

    // Log the action
    await AuditLog.log({
      userId: req.user.id,
      action: "update",
      resource: "Course",
      resourceId: course._id,
      resourceName: course.title,
      changes: {
        after: { enrolled: true }
      },
      ipAddress: req.ip,
      userAgent: req.get("user-agent")
    });

    res.status(200).json({
      success: true,
      message: "Successfully enrolled in course",
      data: {
        courseId: course._id,
        title: course.title,
        enrolledAt: new Date()
      }
    });
  } catch (error) {
    console.error("Enroll in course error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to enroll in course"
    });
  }
};

// @desc    Mark course as completed
// @route   POST /api/courses/:id/complete
// @access  Private
exports.completeCourse = async (req, res) => {
  try {
    const { score } = req.body;
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found"
      });
    }

    // Check if enrolled
    const isEnrolled = course.enrolledStudents.some(
      student => student.toString() === req.user.id
    );

    if (!isEnrolled) {
      return res.status(400).json({
        success: false,
        message: "You must enroll in the course first"
      });
    }

    // Mark as completed
    await course.markCompleted(req.user.id, score);

    // Log the action
    await AuditLog.log({
      userId: req.user.id,
      action: "update",
      resource: "Course",
      resourceId: course._id,
      resourceName: course.title,
      changes: {
        after: { completed: true, score }
      },
      ipAddress: req.ip,
      userAgent: req.get("user-agent")
    });

    res.status(200).json({
      success: true,
      message: "Course marked as completed",
      data: {
        courseId: course._id,
        title: course.title,
        completedAt: new Date(),
        score: score || null
      }
    });
  } catch (error) {
    console.error("Complete course error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mark course as completed"
    });
  }
};

// @desc    Rate course
// @route   POST /api/courses/:id/rate
// @access  Private
exports.rateCourse = async (req, res) => {
  try {
    const { rating, review } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5"
      });
    }

    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found"
      });
    }

    // Check if user has completed the course
    const hasCompleted = course.completedBy.some(
      completion => completion.user.toString() === req.user.id
    );

    if (!hasCompleted) {
      return res.status(400).json({
        success: false,
        message: "You must complete the course before rating"
      });
    }

    // Check if already rated
    const existingRatingIndex = course.ratings.findIndex(
      r => r.user.toString() === req.user.id
    );

    if (existingRatingIndex > -1) {
      // Update existing rating
      course.ratings[existingRatingIndex].rating = rating;
      course.ratings[existingRatingIndex].review = review;
    } else {
      // Add new rating
      course.ratings.push({
        user: req.user.id,
        rating,
        review
      });
    }

    await course.save();

    res.status(200).json({
      success: true,
      message: existingRatingIndex > -1 ? "Rating updated" : "Rating submitted",
      data: {
        rating,
        review,
        averageRating: course.averageRating,
        totalReviews: course.totalReviews
      }
    });
  } catch (error) {
    console.error("Rate course error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to submit rating"
    });
  }
};

// @desc    Get user's enrolled courses
// @route   GET /api/courses/my-courses
// @access  Private
exports.getMyCourses = async (req, res) => {
  try {
    const courses = await Course.find({
      enrolledStudents: req.user.id
    })
    .populate("createdBy", "name email")
    .sort({ updatedAt: -1 });

    // Add completion status
    const coursesWithStatus = courses.map(course => ({
      ...course.toObject(),
      isCompleted: course.completedBy.some(
        completion => completion.user.toString() === req.user.id
      )
    }));

    res.status(200).json({
      success: true,
      count: courses.length,
      data: coursesWithStatus
    });
  } catch (error) {
    console.error("Get my courses error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch your courses"
    });
  }
};

// @desc    Get course statistics
// @route   GET /api/courses/stats
// @access  Private/Admin
exports.getCourseStats = async (req, res) => {
  try {
    const stats = await Course.aggregate([
      {
        $group: {
          _id: null,
          totalCourses: { $sum: 1 },
          publishedCourses: {
            $sum: { $cond: [{ $eq: ["$isPublished", true] }, 1, 0] }
          },
          featuredCourses: {
            $sum: { $cond: [{ $eq: ["$isFeatured", true] }, 1, 0] }
          },
          totalEnrollments: { $sum: "$totalEnrollments" },
          totalViews: { $sum: "$views" },
          averageRating: { $avg: "$averageRating" }
        }
      },
      {
        $project: {
          _id: 0,
          totalCourses: 1,
          publishedCourses: 1,
          featuredCourses: 1,
          totalEnrollments: 1,
          totalViews: 1,
          averageRating: { $round: ["$averageRating", 2] }
        }
      }
    ]);

    // Category-wise distribution
    const categoryStats = await Course.aggregate([
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
          totalEnrollments: { $sum: "$totalEnrollments" },
          averageRating: { $avg: "$averageRating" }
        }
      },
      {
        $project: {
          _id: 1,
          count: 1,
          totalEnrollments: 1,
          averageRating: { $round: ["$averageRating", 2] }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Popular courses
    const popularCourses = await Course.find({ isPublished: true })
      .select("title category totalEnrollments averageRating views")
      .sort({ totalEnrollments: -1, averageRating: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      data: {
        overall: stats[0] || {
          totalCourses: 0,
          publishedCourses: 0,
          featuredCourses: 0,
          totalEnrollments: 0,
          totalViews: 0,
          averageRating: 0
        },
        byCategory: categoryStats,
        popularCourses
      }
    });
  } catch (error) {
    console.error("Get course stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch course statistics"
    });
  }
};