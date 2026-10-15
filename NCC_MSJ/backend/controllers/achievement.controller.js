const Achievement = require("../models/Achivement.model");
const User = require("../models/User.model");
const AuditLog = require("../models/AuditLog.model");

// @desc    Get all achievements
// @route   GET /api/achievements
// @access  Public/Private
exports.getAchievements = async (req, res) => {
  try {
    /* =========================
       1. PAGINATION
    ========================== */
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 12, 50);
    const skip = (page - 1) * limit;

    /* =========================
       2. BASE FILTER
    ========================== */
    const filter = {};

    /* =========================
       3. BASIC FILTERS
    ========================== */
    if (req.query.userId) filter.user = req.query.userId;
    if (req.query.category) filter.category = req.query.category;
    if (req.query.level) filter.level = req.query.level;

    if (req.query.verified !== undefined) {
      filter.verified = req.query.verified === "true";
    }

    /* =========================
       4. DATE RANGE FILTER
    ========================== */
    if (req.query.startDate || req.query.endDate) {
      filter.date = {};

      if (req.query.startDate) {
        const startDate = new Date(req.query.startDate);
        if (!isNaN(startDate)) filter.date.$gte = startDate;
      }

      if (req.query.endDate) {
        const endDate = new Date(req.query.endDate);
        if (!isNaN(endDate)) filter.date.$lte = endDate;
      }
    }

    /* =========================
       5. SEARCH (REGEX)
    ========================== */
    if (req.query.search) {
      filter.$or = [
        { title: { $regex: req.query.search, $options: "i" } },
        { description: { $regex: req.query.search, $options: "i" } },
        { organizer: { $regex: req.query.search, $options: "i" } }
      ];
    }

    /* =========================
       6. ROLE-BASED VISIBILITY
    ========================== */
    const currentUserId = req.user?._id?.toString();

    if (req.user?.role !== "admin") {
      filter.isPublic = true;

      // Force verified=true ONLY if user is viewing others' achievements
      if (
        (!req.query.userId || req.query.userId !== currentUserId) &&
        req.query.verified === undefined
      ) {
        filter.verified = true;
      }
    }

    /* =========================
       7. SORTING (SAFE)
    ========================== */
    let sort = { date: -1 };
    const allowedSortFields = ["date", "level", "category", "createdAt"];

    if (req.query.sortBy) {
      const [field, order] = req.query.sortBy.split(":");
      if (allowedSortFields.includes(field)) {
        sort = { [field]: order === "desc" ? -1 : 1 };
      }
    }

    /* =========================
       8. QUERY EXECUTION
    ========================== */
    const [achievements, total] = await Promise.all([
      Achievement.find(filter)
        .populate("user", "name studentId department profileImage")
        .populate("verifiedBy", "name")
        .skip(skip)
        .limit(limit)
        .sort(sort)
        .lean(),
      Achievement.countDocuments(filter)
    ]);

    /* =========================
       9. RESPONSE
    ========================== */
    res.status(200).json({
      success: true,
      count: achievements.length,
      total,
      pagination: {
        page,
        limit,
        pages: Math.ceil(total / limit),
        next: page * limit < total ? page + 1 : null,
        prev: page > 1 ? page - 1 : null
      },
      data: achievements
    });

  } catch (error) {
    console.error("Get achievements error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch achievements"
    });
  }
};


// @desc    Get single achievement
// @route   GET /api/achievements/:id
// @access  Public/Private
exports.getAchievement = async (req, res) => {
  try {
    /* =========================
       1. FETCH ACHIEVEMENT
    ========================== */
    const achievement = await Achievement.findById(req.params.id)
      .populate("user", "name studentId department year profileImage")
      .populate("verifiedBy", "name email profileImage")
      .populate("event", "title")
      .populate("course", "title")
      .populate("comments.user", "name profileImage")
      .lean();

    if (!achievement) {
      return res.status(404).json({
        success: false,
        message: "Achievement not found"
      });
    }

    /* =========================
       2. PERMISSION CHECK
    ========================== */
    const currentUserId = req.user?._id?.toString();
    const ownerId = achievement.user?._id?.toString();

    if (
      !achievement.isPublic &&
      req.user?.role !== "admin" &&
      currentUserId !== ownerId
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to view this achievement"
      });
    }

    /* =========================
       3. LIKE STATUS (SAFE)
    ========================== */
    achievement.hasLiked = false;

    if (req.user && achievement.likes?.length) {
      achievement.hasLiked = achievement.likes.some(
        like => like.toString() === currentUserId
      );
    }

    /* =========================
       4. INCREMENT VIEWS (NON-BLOCKING)
    ========================== */
    Achievement.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } }
    ).catch(err => console.error("View increment failed:", err));

    /* =========================
       5. RESPONSE
    ========================== */
    res.status(200).json({
      success: true,
      data: achievement
    });

  } catch (error) {
    console.error("Get achievement error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch achievement"
    });
  }
};


// @desc    Create achievement
// @route   POST /api/achievements
// @access  Private
exports.createAchievement = async (req, res) => {
  try {
    /* =========================
       1. RESOLVE TARGET USER
    ========================== */
    const currentUserId = req.user?.id?.toString();
    const targetUserId = req.body.user || currentUserId;

    const user = await User.findById(targetUserId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    /* =========================
       2. PERMISSION CHECK
    ========================== */
    if (
      req.user.role !== "admin" &&
      targetUserId !== currentUserId
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to create achievements for another user"
      });
    }

    /* =========================
       3. SANITIZE INPUT (SECURITY)
    ========================== */
    const achievementData = {
      title: req.body.title,
      description: req.body.description,
      category: req.body.category,
      level: req.body.level,
      date: req.body.date,
      organizer: req.body.organizer,
      event: req.body.event,
      course: req.body.course,
      user: targetUserId,

      // SAFE DEFAULTS
      verified: false,
      isPublic: req.body.isPublic ?? true
    };

    /* =========================
       4. AUTO-VERIFICATION LOGIC
    ========================== */
    const autoVerify = false; // connect to settings later

    if (autoVerify && req.user.role === "admin") {
      achievementData.verified = true;
      achievementData.verifiedBy = currentUserId;
      achievementData.verifiedAt = new Date();
    }

    /* =========================
       5. CREATE ACHIEVEMENT
    ========================== */
    const achievement = await Achievement.create(achievementData);

    /* =========================
       6. POPULATE RESPONSE
    ========================== */
    await achievement.populate("user", "name studentId department");

    /* =========================
       7. AUDIT LOG (NON-BLOCKING)
    ========================== */
    AuditLog.log({
      userId: currentUserId,
      action: "create",
      resource: "Achievement",
      resourceId: achievement._id,
      resourceName: achievement.title,
      changes: {
        after: {
          title: achievement.title,
          category: achievement.category,
          level: achievement.level,
          verified: achievement.verified,
          owner: user.name
        }
      },
      ipAddress: req.ip,
      userAgent: req.get("user-agent")
    }).catch(err => console.error("Audit log failed:", err));

    /* =========================
       8. RESPONSE
    ========================== */
    res.status(201).json({
      success: true,
      message: "Achievement created successfully",
      data: achievement
    });

  } catch (error) {
    console.error("Create achievement error:", error);

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(", ")
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to create achievement"
    });
  }
};


// @desc    Update achievement
// @route   PUT /api/achievements/:id
// @access  Private
exports.updateAchievement = async (req, res) => {
  try {
    /* =========================
       1. FETCH ACHIEVEMENT
    ========================== */
    let achievement = await Achievement.findById(req.params.id);

    if (!achievement) {
      return res.status(404).json({
        success: false,
        message: "Achievement not found"
      });
    }

    /* =========================
       2. PERMISSION CHECK
    ========================== */
    const currentUserId = req.user?._id?.toString();
    const ownerId = achievement.user?.toString();

    if (req.user.role !== "admin" && currentUserId !== ownerId) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this achievement"
      });
    }

    /* =========================
       3. SANITIZE UPDATE DATA
    ========================== */
    const allowedUpdates = [
      "title",
      "description",
      "category",
      "level",
      "date",
      "organizer",
      "event",
      "course",
      "isPublic"
    ];

    // Admin-only fields
    if (req.user.role === "admin") {
      allowedUpdates.push("verified", "verifiedBy", "verifiedAt", "points");
    }

    const updateData = {};
    for (const key of allowedUpdates) {
      if (req.body[key] !== undefined) {
        updateData[key] = req.body[key];
      }
    }

    /* =========================
       4. ADMIN VERIFICATION LOGIC
    ========================== */
    if (
      req.user.role === "admin" &&
      updateData.verified === true
    ) {
      updateData.verifiedBy = currentUserId;
      updateData.verifiedAt = new Date();
    }

    /* =========================
       5. STORE OLD DATA (AUDIT)
    ========================== */
    const oldData = {
      title: achievement.title,
      category: achievement.category,
      level: achievement.level,
      verified: achievement.verified,
      points: achievement.points
    };

    /* =========================
       6. UPDATE ACHIEVEMENT
    ========================== */
    achievement = await Achievement.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true
      }
    )
      .populate("user", "name studentId department")
      .populate("verifiedBy", "name");

    /* =========================
       7. AUDIT LOG (NON-BLOCKING)
    ========================== */
    AuditLog.log({
      userId: currentUserId,
      action: "update",
      resource: "Achievement",
      resourceId: achievement._id,
      resourceName: achievement.title,
      changes: {
        before: oldData,
        after: {
          title: achievement.title,
          category: achievement.category,
          level: achievement.level,
          verified: achievement.verified,
          points: achievement.points
        },
        fields: Object.keys(updateData)
      },
      ipAddress: req.ip,
      userAgent: req.get("user-agent")
    }).catch(err => console.error("Audit log failed:", err));

    /* =========================
       8. RESPONSE
    ========================== */
    res.status(200).json({
      success: true,
      message: "Achievement updated successfully",
      data: achievement
    });

  } catch (error) {
    console.error("Update achievement error:", error);

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(", ")
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to update achievement"
    });
  }
};


// @desc    Delete achievement
// @route   DELETE /api/achievements/:id
// @access  Private
exports.deleteAchievement = async (req, res) => {
  try {
    /* =========================
       1. FETCH ACHIEVEMENT
    ========================== */
    const achievement = await Achievement.findById(req.params.id)
      .populate("user", "name");

    if (!achievement) {
      return res.status(404).json({
        success: false,
        message: "Achievement not found"
      });
    }

    /* =========================
       2. PERMISSION CHECK
    ========================== */
    const currentUserId = req.user?._id?.toString();
    const ownerId = achievement.user?._id?.toString();

    if (req.user.role !== "admin" && currentUserId !== ownerId) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this achievement"
      });
    }

    /* =========================
       3. STORE DATA FOR AUDIT
    ========================== */
    const achievementData = {
      title: achievement.title,
      user: achievement.user.name,
      category: achievement.category,
      level: achievement.level,
      verified: achievement.verified
    };

    /* =========================
       4. DELETE ACHIEVEMENT
    ========================== */
    await achievement.deleteOne();

    /* =========================
       5. AUDIT LOG (NON-BLOCKING)
    ========================== */
    AuditLog.log({
      userId: currentUserId,
      action: "delete",
      resource: "Achievement",
      resourceId: achievement._id,
      resourceName: achievement.title,
      changes: {
        before: achievementData
      },
      ipAddress: req.ip,
      userAgent: req.get("user-agent")
    }).catch(err => console.error("Audit log failed:", err));

    /* =========================
       6. RESPONSE
    ========================== */
    res.status(200).json({
      success: true,
      message: "Achievement deleted successfully",
      data: {}
    });

  } catch (error) {
    console.error("Delete achievement error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete achievement"
    });
  }
};


// @desc    Verify achievement (Admin only)
// @route   PATCH /api/achievements/:id/verify
// @access  Private/Admin
exports.verifyAchievement = async (req, res) => {
  try {
    const { verified = true, notes } = req.body;

    const achievement = await Achievement.findById(req.params.id)
      .populate("user", "name");

    if (!achievement) {
      return res.status(404).json({
        success: false,
        message: "Achievement not found"
      });
    }

    // Store old verification status
    const oldVerified = achievement.verified;

    // Verify/unverify achievement
    await achievement.verify(
      verified ? req.user.id : null,
      notes
    );

    // Repopulate for response
    await achievement.populate("verifiedBy", "name");

    // Log the action
    await AuditLog.log({
      userId: req.user.id,
      action: verified ? "approve" : "reject",
      resource: "Achievement",
      resourceId: achievement._id,
      resourceName: achievement.title,
      changes: {
        before: { verified: oldVerified },
        after: { verified: achievement.verified },
        fields: ["verified", "verifiedBy", "verifiedAt", "verificationNotes"]
      },
      ipAddress: req.ip,
      userAgent: req.get("user-agent")
    });

    res.status(200).json({
      success: true,
      message: verified ? "Achievement verified successfully" : "Achievement unverified",
      data: achievement
    });
  } catch (error) {
    console.error("Verify achievement error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to verify achievement"
    });
  }
};

// @desc    Like/unlike achievement
// @route   POST /api/achievements/:id/like
// @access  Private
exports.toggleLike = async (req, res) => {
  try {
    const currentUserId = req.user?._id?.toString();

    /* =========================
       1. FETCH ACHIEVEMENT
    ========================== */
    const achievement = await Achievement.findById(req.params.id);

    if (!achievement) {
      return res.status(404).json({
        success: false,
        message: "Achievement not found"
      });
    }

    /* =========================
       2. CHECK IF USER HAS LIKED
    ========================== */
    const hasLiked = achievement.likes?.some(
      like => like.toString() === currentUserId
    );

    /* =========================
       3. TOGGLE LIKE
    ========================== */
    if (hasLiked) {
      // Unlike
      achievement.likes = achievement.likes.filter(
        like => like.toString() !== currentUserId
      );
    } else {
      // Like
      achievement.likes.push(currentUserId);
    }

    /* =========================
       4. SAVE
    ========================== */
    await achievement.save();

    /* =========================
       5. RESPONSE
    ========================== */
    res.status(200).json({
      success: true,
      message: hasLiked ? "Achievement unliked" : "Achievement liked",
      data: {
        likes: achievement.likes.length,
        hasLiked: !hasLiked
      }
    });

  } catch (error) {
    console.error("Toggle like error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to toggle like"
    });
  }
};


// @desc    Add comment to achievement
// @route   POST /api/achievements/:id/comments
// @access  Private
exports.addComment = async (req, res) => {
  try {
    const currentUserId = req.user?._id?.toString();
    const { text } = req.body;

    /* =========================
       1. VALIDATE INPUT
    ========================== */
    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Comment text is required"
      });
    }

    /* =========================
       2. FETCH ACHIEVEMENT
    ========================== */
    const achievement = await Achievement.findById(req.params.id);

    if (!achievement) {
      return res.status(404).json({
        success: false,
        message: "Achievement not found"
      });
    }

    /* =========================
       3. ADD COMMENT (SECURE)
    ========================== */
    const comment = {
      user: currentUserId,
      text: text.trim(),
      createdAt: new Date()
    };

    achievement.comments.push(comment);
    await achievement.save();

    /* =========================
       4. POPULATE COMMENTS FOR RESPONSE
    ========================== */
    const updatedAchievement = await Achievement.findById(req.params.id)
      .populate("comments.user", "name profileImage");

    const newComment = updatedAchievement.comments[updatedAchievement.comments.length - 1];

    /* =========================
       5. RESPONSE
    ========================== */
    res.status(201).json({
      success: true,
      message: "Comment added successfully",
      data: newComment
    });

  } catch (error) {
    console.error("Add comment error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add comment"
    });
  }
};


// @desc    Get user's achievements
// @route   GET /api/achievements/user/:userId
// @access  Public/Private
exports.getUserAchievements = async (req, res) => {
  try {
    const currentUserId = req.user?._id?.toString();
    const targetUserId = req.params.userId || currentUserId;

    /* =========================
       1. PERMISSION CHECK
    ========================== */
    let filter = { user: targetUserId };

    if (req.user?.role !== "admin" && currentUserId !== targetUserId) {
      // Only public and verified achievements for others
      filter.isPublic = true;
      filter.verified = true;
    }

    /* =========================
       2. FETCH ACHIEVEMENTS
    ========================== */
    const achievements = await Achievement.find(filter)
      .populate("user", "name studentId department profileImage")
      .populate("verifiedBy", "name")
      .sort({ date: -1 })
      .lean();

    /* =========================
       3. CALCULATE TOTAL POINTS (OPTIONAL)
    ========================== */
    let totalPoints = null;
    if (currentUserId === targetUserId || req.user.role === "admin") {
      // Only calculate total points for self or admin
      totalPoints = await Achievement.getUserTotalPoints(targetUserId);
    }

    /* =========================
       4. RESPONSE
    ========================== */
    res.status(200).json({
      success: true,
      data: {
        achievements,
        totalPoints,
        totalAchievements: achievements.length,
        verifiedAchievements: achievements.filter(a => a.verified).length
      }
    });

  } catch (error) {
    console.error("Get user achievements error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch user achievements"
    });
  }
};


// @desc    Get achievement statistics
// @route   GET /api/achievements/stats
// @access  Private/Admin
exports.getAchievementStats = async (req, res) => {
  try {
    /* =========================
       1. OVERALL STATISTICS
    ========================== */
    const overallStats = await Achievement.aggregate([
      {
        $group: {
          _id: null,
          totalAchievements: { $sum: 1 },
          verifiedAchievements: {
            $sum: { $cond: [{ $eq: ["$verified", true] }, 1, 0] }
          },
          totalPoints: { $sum: "$points" },
          averagePoints: { $avg: "$points" }
        }
      },
      {
        $project: {
          _id: 0,
          totalAchievements: 1,
          verifiedAchievements: 1,
          verificationRate: {
            $cond: [
              { $eq: ["$totalAchievements", 0] },
              0,
              { $multiply: [{ $divide: ["$verifiedAchievements", "$totalAchievements"] }, 100] }
            ]
          },
          totalPoints: 1,
          averagePoints: { $round: ["$averagePoints", 2] }
        }
      }
    ]);

    /* =========================
       2. CATEGORY-WISE STATISTICS
    ========================== */
    const categoryStats = await Achievement.aggregate([
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
          totalPoints: { $sum: "$points" },
          verifiedCount: {
            $sum: { $cond: [{ $eq: ["$verified", true] }, 1, 0] }
          }
        }
      },
      {
        $project: {
          _id: 0,
          category: "$_id",
          count: 1,
          totalPoints: 1,
          verified: "$verifiedCount",
          verificationRate: {
            $cond: [
              { $eq: ["$count", 0] },
              0,
              { $multiply: [{ $divide: ["$verifiedCount", "$count"] }, 100] }
            ]
          }
        }
      },
      { $sort: { count: -1 } }
    ]);

    /* =========================
       3. LEVEL-WISE STATISTICS
    ========================== */
    const levelOrder = ["College", "University", "State", "National", "International"];
    const levelStats = await Achievement.aggregate([
      {
        $group: {
          _id: "$level",
          count: { $sum: 1 },
          averagePoints: { $avg: "$points" }
        }
      },
      {
        $project: {
          _id: 0,
          level: "$_id",
          count: 1,
          averagePoints: { $round: ["$averagePoints", 2] },
          sortOrder: {
            $indexOfArray: [levelOrder, "$_id"]
          }
        }
      },
      { $sort: { sortOrder: 1 } }
    ]);

    /* =========================
       4. MONTHLY TREND (LAST 12 MONTHS)
    ========================== */
    const monthlyTrend = await Achievement.aggregate([
      {
        $group: {
          _id: {
            year: { $year: "$date" },
            month: { $month: "$date" }
          },
          count: { $sum: 1 },
          verifiedCount: { $sum: { $cond: [{ $eq: ["$verified", true] }, 1, 0] } }
        }
      },
      {
        $project: {
          _id: 0,
          year: "$_id.year",
          month: "$_id.month",
          count: 1,
          verified: "$verifiedCount",
          verificationRate: {
            $cond: [
              { $eq: ["$count", 0] },
              0,
              { $multiply: [{ $divide: ["$verifiedCount", "$count"] }, 100] }
            ]
          }
        }
      },
      { $sort: { year: -1, month: -1 } },
      { $limit: 12 }
    ]);

    /* =========================
       5. RESPONSE
    ========================== */
    res.status(200).json({
      success: true,
      data: {
        overall: overallStats[0] || {
          totalAchievements: 0,
          verifiedAchievements: 0,
          verificationRate: 0,
          totalPoints: 0,
          averagePoints: 0
        },
        byCategory: categoryStats,
        byLevel: levelStats,
        monthlyTrend
      }
    });
  } catch (error) {
    console.error("Get achievement stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch achievement statistics"
    });
  }
};


// @desc    Get leaderboard
// @route   GET /api/achievements/leaderboard
// @access  Public
exports.getLeaderboard = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const category = req.query.category || null;

    const leaderboard = await Achievement.getLeaderboard(limit, category);

    res.status(200).json({
      success: true,
      data: leaderboard
    });
  } catch (error) {
    console.error("Get leaderboard error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch leaderboard"
    });
  }
};