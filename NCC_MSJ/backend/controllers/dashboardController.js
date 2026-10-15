const User = require('../models/User');
const Event = require('../models/Event');
const Attendance = require('../models/Attendance');
const Achievement = require('../models/Achievement');
const Course = require('../models/Course');

// @desc    Get dashboard statistics
// @route   GET /api/dashboard/stats
// @access  Private
exports.getDashboardStats = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user data
    const user = await User.findById(userId).select('-password');

    // Get total events count
    const totalEvents = await Event.countDocuments();

    // Get user's attendance
    const attendedEvents = await Attendance.countDocuments({
      user: userId,
      status: 'present'
    });

    // Calculate attendance percentage
    const attendancePercentage = totalEvents > 0 
      ? Math.round((attendedEvents / totalEvents) * 100) 
      : 0;

    // Get user's achievements
    const achievements = await Achievement.find({ user: userId })
      .sort({ date: -1 })
      .limit(5);

    // Get recent events (last 5)
    const recentEvents = await Event.find()
      .sort({ date: -1 })
      .limit(5)
      .select('title date status');

    // Get upcoming events
    const upcomingEvents = await Event.find({
      date: { $gte: new Date() },
      status: 'Upcoming'
    })
      .sort({ date: 1 })
      .limit(3)
      .select('title date type');

    // Get system-wide stats (for admin)
    let systemStats = {};
    if (req.user.role === 'admin') {
      const totalUsers = await User.countDocuments();
      const totalAchievements = await Achievement.countDocuments();
      const activeEvents = await Event.countDocuments({ status: 'Ongoing' });
      
      systemStats = {
        totalUsers,
        totalAchievements,
        activeEvents
      };
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          studentId: user.studentId,
          department: user.department,
          year: user.year,
          role: user.role
        },
        attendancePercentage,
        attendedEvents,
        totalEvents,
        achievements,
        recentEvents,
        upcomingEvents,
        ...(req.user.role === 'admin' && { systemStats })
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard data',
      error: error.message
    });
  }
};

// @desc    Get user's detailed stats
// @route   GET /api/dashboard/user-stats
// @access  Private
exports.getUserStats = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get monthly attendance
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyAttendance = await Attendance.aggregate([
      {
        $match: {
          user: mongoose.Types.ObjectId(userId),
          date: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Get achievements by category
    const achievementsByCategory = await Achievement.aggregate([
      {
        $match: { user: mongoose.Types.ObjectId(userId) }
      },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get attendance by event type
    const attendanceByType = await Attendance.aggregate([
      {
        $match: { user: mongoose.Types.ObjectId(userId) }
      },
      {
        $lookup: {
          from: 'events',
          localField: 'event',
          foreignField: '_id',
          as: 'eventDetails'
        }
      },
      { $unwind: '$eventDetails' },
      {
        $group: {
          _id: '$eventDetails.type',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        monthlyAttendance,
        achievementsByCategory,
        attendanceByType
      }
    });
  } catch (error) {
    console.error('User stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user statistics',
      error: error.message
    });
  }
};

// @desc    Get admin dashboard data
// @route   GET /api/dashboard/admin
// @access  Private/Admin
exports.getAdminDashboard = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }

    // Get total counts
    const totalUsers = await User.countDocuments();
    const totalEvents = await Event.countDocuments();
    const totalAchievements = await Achievement.countDocuments();
    const totalCourses = await Course.countDocuments();

    // Get recent activities
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name email createdAt');

    const recentEvents = await Event.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title date status');

    const recentAchievements = await Achievement.find()
      .populate('user', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    // Get user growth over time (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const userGrowth = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Get attendance overview
    const attendanceOverview = await Attendance.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        counts: {
          totalUsers,
          totalEvents,
          totalAchievements,
          totalCourses
        },
        recentActivities: {
          users: recentUsers,
          events: recentEvents,
          achievements: recentAchievements
        },
        userGrowth,
        attendanceOverview
      }
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching admin dashboard',
      error: error.message
    });
  }
};