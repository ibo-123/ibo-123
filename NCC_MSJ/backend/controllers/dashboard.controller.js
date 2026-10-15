const User = require("../models/User.model");
const Course = require("../models/course.model");
const Attendance = require("../models/Attendance.model");
const Achievement = require("../models/Achivement.model");
const Event = require("../models/event.model");

// @desc    Get admin dashboard statistics
// @route   GET /api/dashboard/admin
// @access  Private/Admin
exports.getAdminDashboard = async (req, res) => {
  try {
    // Get current date and calculate date ranges
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);
    const lastMonth = new Date(today);
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    // Execute all queries in parallel for better performance
    const [
      userStats,
      courseStats,
      attendanceStats,
      achievementStats,
      eventStats,
      recentUsers,
      recentAchievements,
      upcomingEvents,
      todayAttendance
    ] = await Promise.all([
      // User Statistics
      User.aggregate([
        {
          $facet: {
            overall: [
              {
                $group: {
                  _id: null,
                  total: { $sum: 1 },
                  active: { $sum: { $cond: [{ $eq: ["$status", "Active"] }, 1, 0] } },
                  admins: { $sum: { $cond: [{ $eq: ["$role", "admin"] }, 1, 0] } }
                }
              }
            ],
            today: [
              { $match: { createdAt: { $gte: today } } },
              { $count: "count" }
            ],
            weeklyGrowth: [
              { $match: { createdAt: { $gte: lastWeek, $lt: today } } },
              { $count: "count" }
            ],
            byDepartment: [
              {
                $group: {
                  _id: "$department",
                  count: { $sum: 1 }
                }
              },
              { $sort: { count: -1 } },
              { $limit: 5 }
            ]
          }
        }
      ]),

      // Course Statistics
      Course.aggregate([
        {
          $facet: {
            overall: [
              {
                $group: {
                  _id: null,
                  total: { $sum: 1 },
                  published: { $sum: { $cond: [{ $eq: ["$isPublished", true] }, 1, 0] } },
                  totalEnrollments: { $sum: "$totalEnrollments" },
                  averageRating: { $avg: "$averageRating" }
                }
              }
            ],
            byCategory: [
              {
                $group: {
                  _id: "$category",
                  count: { $sum: 1 },
                  enrollments: { $sum: "$totalEnrollments" }
                }
              },
              { $sort: { count: -1 } },
              { $limit: 5 }
            ]
          }
        }
      ]),

      // Attendance Statistics
      Attendance.aggregate([
        {
          $facet: {
            today: [
              { $match: { date: { $gte: today } } },
              {
                $group: {
                  _id: "$status",
                  count: { $sum: 1 }
                }
              }
            ],
            weekly: [
              { $match: { date: { $gte: lastWeek } } },
              {
                $group: {
                  _id: null,
                  present: { $sum: { $cond: [{ $eq: ["$status", "Present"] }, 1, 0] } },
                  total: { $sum: 1 }
                }
              }
            ],
            monthlyTrend: [
              { $match: { date: { $gte: lastMonth } } },
              {
                $group: {
                  _id: {
                    $dateToString: { format: "%Y-%m-%d", date: "$date" }
                  },
                  present: { $sum: { $cond: [{ $eq: ["$status", "Present"] }, 1, 0] } },
                  total: { $sum: 1 }
                }
              },
              { $sort: { _id: 1 } },
              { $limit: 15 }
            ]
          }
        }
      ]),

      // Achievement Statistics
      Achievement.aggregate([
        {
          $facet: {
            overall: [
              {
                $group: {
                  _id: null,
                  total: { $sum: 1 },
                  verified: { $sum: { $cond: [{ $eq: ["$verified", true] }, 1, 0] } },
                  totalPoints: { $sum: "$points" }
                }
              }
            ],
            byCategory: [
              {
                $group: {
                  _id: "$category",
                  count: { $sum: 1 },
                  verified: { $sum: { $cond: [{ $eq: ["$verified", true] }, 1, 0] } }
                }
              },
              { $sort: { count: -1 } },
              { $limit: 5 }
            ],
            leaderboard: [
              { $match: { verified: true } },
              {
                $group: {
                  _id: "$user",
                  points: { $sum: "$points" },
                  achievements: { $sum: 1 }
                }
              },
              { $sort: { points: -1 } },
              { $limit: 5 },
              {
                $lookup: {
                  from: "users",
                  localField: "_id",
                  foreignField: "_id",
                  as: "userInfo"
                }
              },
              { $unwind: "$userInfo" },
              {
                $project: {
                  _id: 0,
                  userId: "$_id",
                  name: "$userInfo.name",
                  studentId: "$userInfo.studentId",
                  points: 1,
                  achievements: 1
                }
              }
            ]
          }
        }
      ]),

      // Event Statistics
      Event.aggregate([
        {
          $facet: {
            overall: [
              {
                $group: {
                  _id: null,
                  total: { $sum: 1 },
                  upcoming: {
                    $sum: {
                      $cond: [
                        {
                          $and: [
                            { $eq: ["$status", "Published"] },
                            { $gt: ["$startDate", today] }
                          ]
                        },
                        1,
                        0
                      ]
                    }
                  },
                  ongoing: { $sum: { $cond: [{ $eq: ["$status", "Ongoing"] }, 1, 0] } },
                  totalRegistrations: { $sum: "$totalRegistrations" }
                }
              }
            ]
          }
        }
      ]),

      // Recent Users (last 5)
      User.find()
        .select("name email studentId department createdAt")
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),

      // Recent Achievements (last 5)
      Achievement.find({ verified: true })
        .populate("user", "name studentId")
        .select("title category level date")
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),

      // Upcoming Events (next 5)
      Event.find({
        status: "Published",
        startDate: { $gt: today }
      })
      .select("title type startDate location")
      .sort({ startDate: 1 })
      .limit(5)
      .lean(),

      // Today's Attendance Summary
      Attendance.aggregate([
        { $match: { date: { $gte: today } } },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    // Process attendance statistics
    const todayAttendanceObj = todayAttendance.reduce((acc, curr) => {
      acc[curr._id] = curr.count;
      return acc;
    }, {});

    const weeklyAttendance = attendanceStats[0].weekly[0] || { present: 0, total: 0 };
    const weeklyAttendanceRate = weeklyAttendance.total > 0 
      ? (weeklyAttendance.present / weeklyAttendance.total) * 100 
      : 0;

    // Format response data
    const dashboardData = {
      overview: {
        users: userStats[0].overall[0] || { total: 0, active: 0, admins: 0 },
        courses: courseStats[0].overall[0] || { total: 0, published: 0, totalEnrollments: 0, averageRating: 0 },
        attendance: {
          today: {
            present: todayAttendanceObj.Present || 0,
            absent: todayAttendanceObj.Absent || 0,
            late: todayAttendanceObj.Late || 0,
            total: Object.values(todayAttendanceObj).reduce((a, b) => a + b, 0)
          },
          weeklyRate: weeklyAttendanceRate
        },
        achievements: achievementStats[0].overall[0] || { total: 0, verified: 0, totalPoints: 0 },
        events: eventStats[0].overall[0] || { total: 0, upcoming: 0, ongoing: 0, totalRegistrations: 0 }
      },
      charts: {
        attendanceTrend: attendanceStats[0].monthlyTrend.map(item => ({
          date: item._id,
          rate: item.total > 0 ? (item.present / item.total) * 100 : 0
        })),
        userDepartments: userStats[0].byDepartment,
        achievementCategories: achievementStats[0].byCategory,
        courseCategories: courseStats[0].byCategory
      },
      leaderboard: achievementStats[0].leaderboard,
      recentActivity: {
        newUsers: recentUsers,
        recentAchievements: recentAchievements,
        upcomingEvents: upcomingEvents
      },
      quickStats: {
        newUsersToday: userStats[0].today[0]?.count || 0,
        weeklyUserGrowth: userStats[0].weeklyGrowth[0]?.count || 0,
        verificationRate: achievementStats[0].overall[0] 
          ? (achievementStats[0].overall[0].verified / achievementStats[0].overall[0].total) * 100
          : 0,
        courseRating: courseStats[0].overall[0]?.averageRating || 0
      }
    };

    res.status(200).json({
      success: true,
      data: dashboardData
    });
  } catch (error) {
    console.error("Get admin dashboard error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard data"
    });
  }
};


// @desc    Get user dashboard statistics
// @route   GET /api/dashboard/user
// @access  Private
exports.getUserDashboard = async (req, res) => {
  try {
    const userId = req.user.id;

    // Calculate date ranges
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    // Execute all queries in parallel
    const [
      userInfo,
      attendanceStats,
      achievements,
      enrolledCourses,
      registeredEvents,
      recentAttendance,
      upcomingEvents
    ] = await Promise.all([
      // User Information
      User.findById(userId)
        .select("name studentId department year activeness profileImage createdAt")
        .lean(),

      // Attendance Statistics
      Attendance.aggregate([
        { $match: { user: userId } },
        {
          $facet: {
            overall: [
              {
                $group: {
                  _id: null,
                  total: { $sum: 1 },
                  present: { $sum: { $cond: [{ $eq: ["$status", "Present"] }, 1, 0] } },
                  totalDuration: { $sum: "$duration" }
                }
              }
            ],
            thisMonth: [
              { $match: { date: { $gte: startOfMonth } } },
              {
                $group: {
                  _id: null,
                  present: { $sum: { $cond: [{ $eq: ["$status", "Present"] }, 1, 0] } },
                  total: { $sum: 1 }
                }
              }
            ],
            monthlyTrend: [
              { $match: { date: { $gte: startOfYear } } },
              {
                $group: {
                  _id: {
                    year: { $year: "$date" },
                    month: { $month: "$date" }
                  },
                  present: { $sum: { $cond: [{ $eq: ["$status", "Present"] }, 1, 0] } },
                  total: { $sum: 1 }
                }
              },
              { $sort: { "_id.year": 1, "_id.month": 1 } }
            ]
          }
        }
      ]),

      // Achievements
      Achievement.aggregate([
        { $match: { user: userId, verified: true } },
        {
          $facet: {
            overall: [
              {
                $group: {
                  _id: null,
                  total: { $sum: 1 },
                  totalPoints: { $sum: "$points" }
                }
              }
            ],
            byLevel: [
              {
                $group: {
                  _id: "$level",
                  count: { $sum: 1 },
                  points: { $sum: "$points" }
                }
              }
            ],
            recent: [
              { $sort: { date: -1 } },
              { $limit: 5 },
              {
                $project: {
                  title: 1,
                  category: 1,
                  level: 1,
                  date: 1,
                  points: 1
                }
              }
            ]
          }
        }
      ]),

      // Enrolled Courses
      Course.find({ enrolledStudents: userId })
        .select("title category thumbnail totalEnrollments averageRating")
        .sort({ updatedAt: -1 })
        .limit(5)
        .lean(),

      // Registered Events
      Event.find({ "attendees.user": userId })
        .select("title type startDate location status")
        .sort({ startDate: 1 })
        .limit(5)
        .lean(),

      // Recent Attendance (last 5)
      Attendance.find({ user: userId })
        .populate("event", "title")
        .select("eventName status date timeIn timeOut")
        .sort({ date: -1 })
        .limit(5)
        .lean(),

      // Upcoming Events (next 5)
      Event.find({
        status: "Published",
        startDate: { $gt: today },
        "attendees.user": userId
      })
      .select("title type startDate location")
      .sort({ startDate: 1 })
      .limit(5)
      .lean()
    ]);

    // Process attendance data
    const overallAttendance = attendanceStats[0].overall[0] || { total: 0, present: 0, totalDuration: 0 };
    const thisMonthAttendance = attendanceStats[0].thisMonth[0] || { present: 0, total: 0 };
    
    const attendanceRate = overallAttendance.total > 0 
      ? (overallAttendance.present / overallAttendance.total) * 100 
      : 0;
    
    const monthlyAttendanceRate = thisMonthAttendance.total > 0
      ? (thisMonthAttendance.present / thisMonthAttendance.total) * 100
      : 0;

    // Process achievement data
    const overallAchievements = achievements[0].overall[0] || { total: 0, totalPoints: 0 };

    // Format monthly trend for chart
    const monthlyTrend = attendanceStats[0].monthlyTrend.map(item => ({
      month: `${item._id.year}-${item._id.month.toString().padStart(2, '0')}`,
      rate: item.total > 0 ? (item.present / item.total) * 100 : 0
    }));

    // Calculate rank based on activeness (simplified)
    const rank = userInfo.activeness >= 90 ? "Gold" :
                 userInfo.activeness >= 75 ? "Silver" :
                 userInfo.activeness >= 50 ? "Bronze" : "Member";

    const dashboardData = {
      user: {
        ...userInfo,
        rank,
        memberSince: userInfo.createdAt ? new Date(userInfo.createdAt).getFullYear() : now.getFullYear()
      },
      stats: {
        attendance: {
          overallRate: attendanceRate,
          monthlyRate: monthlyAttendanceRate,
          totalHours: Math.round(overallAttendance.totalDuration / 60),
          streak: 0 // You can implement streak logic
        },
        achievements: {
          total: overallAchievements.total,
          points: overallAchievements.totalPoints,
          byLevel: achievements[0].byLevel
        },
        courses: {
          enrolled: enrolledCourses.length,
          completed: enrolledCourses.filter(c => c.completed).length // You need to track completion
        },
        events: {
          attended: registeredEvents.filter(e => e.status === "Completed").length,
          upcoming: upcomingEvents.length
        }
      },
      charts: {
        attendanceTrend: monthlyTrend,
        achievementLevels: achievements[0].byLevel
      },
      recentActivity: {
        attendance: recentAttendance,
        achievements: achievements[0].recent,
        upcomingEvents
      },
      quickLinks: {
        courses: enrolledCourses,
        events: registeredEvents
      }
    };

    res.status(200).json({
      success: true,
      data: dashboardData
    });
  } catch (error) {
    console.error("Get user dashboard error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch user dashboard"
    });
  }
};

// @desc    Get system overview
// @route   GET /api/dashboard/overview
// @access  Private/Admin
exports.getSystemOverview = async (req, res) => {
  try {
    const [totalUsers, totalCourses, totalAttendances, totalAchievements, totalEvents] = await Promise.all([
      User.countDocuments(),
      Course.countDocuments(),
      Attendance.countDocuments(),
      Achievement.countDocuments(),
      Event.countDocuments()
    ]);

    // Get recent growth (last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const [newUsers, newCourses, newAchievements] = await Promise.all([
      User.countDocuments({ createdAt: { $gte: weekAgo } }),
      Course.countDocuments({ createdAt: { $gte: weekAgo } }),
      Achievement.countDocuments({ createdAt: { $gte: weekAgo } })
    ]);

    // Get system health metrics
    const activeUsers = await User.countDocuments({ 
      lastLogin: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } 
    });

    const verificationRate = await Achievement.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          verified: { $sum: { $cond: [{ $eq: ["$verified", true] }, 1, 0] } }
        }
      },
      {
        $project: {
          rate: {
            $multiply: [
              { $divide: ["$verified", "$total"] },
              100
            ]
          }
        }
      }
    ]);

    const attendanceRate = await Attendance.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          present: { $sum: { $cond: [{ $eq: ["$status", "Present"] }, 1, 0] } }
        }
      },
      {
        $project: {
          rate: {
            $multiply: [
              { $divide: ["$present", "$total"] },
              100
            ]
          }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        totals: {
          users: totalUsers,
          courses: totalCourses,
          attendances: totalAttendances,
          achievements: totalAchievements,
          events: totalEvents
        },
        growth: {
          users: newUsers,
          courses: newCourses,
          achievements: newAchievements
        },
        metrics: {
          activeUsers,
          verificationRate: verificationRate[0]?.rate || 0,
          attendanceRate: attendanceRate[0]?.rate || 0
        }
      }
    });
  } catch (error) {
    console.error("Get system overview error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch system overview"
    });
  }
};