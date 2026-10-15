const User = require("../models/User.model");
const AuditLog = require("../models/AuditLog.model");
const bcrypt = require("bcryptjs");

// @desc    Get all users (Admin only)
// @route   GET /api/users
// @access  Private/Admin
exports.getAllUsers = async (req, res) => {
  try {
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Filters
    const filter = {};
    if (req.query.role) filter.role = req.query.role;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.department) filter.department = req.query.department;
    if (req.query.year) filter.year = req.query.year;
    if (req.query.search) {
      filter.$or = [
        { name: { $regex: req.query.search, $options: "i" } },
        { email: { $regex: req.query.search, $options: "i" } },
        { studentId: { $regex: req.query.search, $options: "i" } }
      ];
    }

    // Sorting
    const sort = {};
    if (req.query.sortBy) {
      const parts = req.query.sortBy.split(":");
      sort[parts[0]] = parts[1] === "desc" ? -1 : 1;
    } else {
      sort.createdAt = -1;
    }

    // Execute query
    const users = await User.find(filter)
      .select("-password -verificationToken -passwordResetToken")
      .skip(skip)
      .limit(limit)
      .sort(sort);

    const total = await User.countDocuments(filter);

    // Log the action
    await AuditLog.log({
      userId: req.user.id,
      action: "read",
      resource: "User",
      resourceName: "Multiple Users",
      ipAddress: req.ip,
      userAgent: req.get("user-agent")
    });

    res.status(200).json({
      success: true,
      count: users.length,
      total,
      pagination: {
        page,
        limit,
        pages: Math.ceil(total / limit),
        next: page * limit < total ? page + 1 : null,
        prev: page > 1 ? page - 1 : null
      },
      data: users
    });
  } catch (error) {
    console.error("Get all users error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch users"
    });
  }
};

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private
exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select("-password -verificationToken -passwordResetToken");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Check permissions (admin or own profile)
    if (req.user.role !== "admin" && req.user.id !== user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to access this user"
      });
    }

    // Log the action
    await AuditLog.log({
      userId: req.user.id,
      action: "read",
      resource: "User",
      resourceId: user._id,
      resourceName: user.name,
      ipAddress: req.ip,
      userAgent: req.get("user-agent")
    });

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch user"
    });
  }
};

// @desc    Get current user profile
// @route   GET /api/users/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select("-password -verificationToken -passwordResetToken");

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error("Get me error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch profile"
    });
  }
};

// @desc    Create user (Admin only)
// @route   POST /api/users
// @access  Private/Admin
exports.createUser = async (req, res) => {
  try {
    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [
        { email: req.body.email },
        { studentId: req.body.studentId }
      ]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: existingUser.email === req.body.email 
          ? "Email already exists" 
          : "Student ID already exists"
      });
    }

    // Create user
    const user = await User.create(req.body);

    // Log the action
    await AuditLog.log({
      userId: req.user.id,
      action: "create",
      resource: "User",
      resourceId: user._id,
      resourceName: user.name,
      changes: {
        after: {
          name: user.name,
          email: user.email,
          studentId: user.studentId,
          role: user.role
        }
      },
      ipAddress: req.ip,
      userAgent: req.get("user-agent")
    });

    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        studentId: user.studentId,
        role: user.role,
        status: user.status
      }
    });
  } catch (error) {
    console.error("Create user error:", error);
    
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: messages.join(", ")
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to create user"
    });
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private
exports.updateUser = async (req, res) => {
  try {
    let user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Check permissions
    if (req.user.role !== "admin" && req.user.id !== user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this user"
      });
    }

    // Prevent non-admins from changing role or status
    if (req.user.role !== "admin") {
      delete req.body.role;
      delete req.body.status;
      delete req.body.activeness;
    }

    // Store old data for audit log
    const oldData = {
      name: user.name,
      email: user.email,
      studentId: user.studentId,
      department: user.department,
      year: user.year,
      role: user.role,
      status: user.status
    };

    // If password is being updated, hash it
    if (req.body.password) {
      req.body.password = await bcrypt.hash(req.body.password, 10);
    }

    // Update user
    user = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    ).select("-password -verificationToken -passwordResetToken");

    // Log the action
    await AuditLog.log({
      userId: req.user.id,
      action: "update",
      resource: "User",
      resourceId: user._id,
      resourceName: user.name,
      changes: {
        before: oldData,
        after: {
          name: user.name,
          email: user.email,
          studentId: user.studentId,
          department: user.department,
          year: user.year,
          role: user.role,
          status: user.status
        },
        fields: Object.keys(req.body)
      },
      ipAddress: req.ip,
      userAgent: req.get("user-agent")
    });

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: user
    });
  } catch (error) {
    console.error("Update user error:", error);
    
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: messages.join(", ")
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to update user"
    });
  }
};

// @desc    Delete user (Admin only)
// @route   DELETE /api/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Prevent deleting self
    if (req.user.id === user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete your own account"
      });
    }

    // Store data for audit log before deletion
    const userData = {
      name: user.name,
      email: user.email,
      studentId: user.studentId,
      role: user.role
    };

    // Delete user
    await user.deleteOne();

    // Log the action
    await AuditLog.log({
      userId: req.user.id,
      action: "delete",
      resource: "User",
      resourceId: user._id,
      resourceName: user.name,
      changes: {
        before: userData
      },
      ipAddress: req.ip,
      userAgent: req.get("user-agent")
    });

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
      data: {}
    });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete user"
    });
  }
};

// @desc    Get users for dropdown (name, studentId, department)
// @route   GET /api/users/dropdown
// @access  Private
exports.getUsersForDropdown = async (req, res) => {
  try {
    const users = await User.find({ status: "Active" })
      .select("name studentId department")
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    console.error("Get users dropdown error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch users"
    });
  }
};

// @desc    Update user status (Admin only)
// @route   PATCH /api/users/:id/status
// @access  Private/Admin
exports.updateUserStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!["Active", "Inactive", "Suspended", "Graduated"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status value"
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const oldStatus = user.status;
    user.status = status;
    await user.save();

    // Log the action
    await AuditLog.log({
      userId: req.user.id,
      action: "update",
      resource: "User",
      resourceId: user._id,
      resourceName: user.name,
      changes: {
        before: { status: oldStatus },
        after: { status: user.status },
        fields: ["status"]
      },
      ipAddress: req.ip,
      userAgent: req.get("user-agent")
    });

    res.status(200).json({
      success: true,
      message: `User status updated to ${status}`,
      data: {
        id: user._id,
        name: user.name,
        status: user.status
      }
    });
  } catch (error) {
    console.error("Update user status error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update user status"
    });
  }
};

// @desc    Update user role (Admin only)
// @route   PATCH /api/users/:id/role
// @access  Private/Admin
exports.updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;

    if (!["admin", "member"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role value"
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const oldRole = user.role;
    user.role = role;
    await user.save();

    // Log the action
    await AuditLog.log({
      userId: req.user.id,
      action: "update",
      resource: "User",
      resourceId: user._id,
      resourceName: user.name,
      changes: {
        before: { role: oldRole },
        after: { role: user.role },
        fields: ["role"]
      },
      ipAddress: req.ip,
      userAgent: req.get("user-agent")
    });

    res.status(200).json({
      success: true,
      message: `User role updated to ${role}`,
      data: {
        id: user._id,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    console.error("Update user role error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update user role"
    });
  }
};

// @desc    Get user statistics
// @route   GET /api/users/stats
// @access  Private/Admin
exports.getUserStats = async (req, res) => {
  try {
    const stats = await User.aggregate([
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          activeUsers: {
            $sum: { $cond: [{ $eq: ["$status", "Active"] }, 1, 0] }
          },
          inactiveUsers: {
            $sum: { $cond: [{ $eq: ["$status", "Inactive"] }, 1, 0] }
          },
          suspendedUsers: {
            $sum: { $cond: [{ $eq: ["$status", "Suspended"] }, 1, 0] }
          },
          admins: {
            $sum: { $cond: [{ $eq: ["$role", "admin"] }, 1, 0] }
          },
          members: {
            $sum: { $cond: [{ $eq: ["$role", "member"] }, 1, 0] }
          },
          averageActiveness: { $avg: "$activeness" }
        }
      },
      {
        $project: {
          _id: 0,
          totalUsers: 1,
          activeUsers: 1,
          inactiveUsers: 1,
          suspendedUsers: 1,
          admins: 1,
          members: 1,
          averageActiveness: { $round: ["$averageActiveness", 2] }
        }
      }
    ]);

    // Department-wise distribution
    const departmentStats = await User.aggregate([
      {
        $group: {
          _id: "$department",
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Year-wise distribution
    const yearStats = await User.aggregate([
      {
        $group: {
          _id: "$year",
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        overall: stats[0] || {
          totalUsers: 0,
          activeUsers: 0,
          inactiveUsers: 0,
          suspendedUsers: 0,
          admins: 0,
          members: 0,
          averageActiveness: 0
        },
        byDepartment: departmentStats,
        byYear: yearStats
      }
    });
  } catch (error) {
    console.error("Get user stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch user statistics"
    });
  }
};