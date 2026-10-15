const Event = require("../models/event.model");
const User = require("../models/User.model");
const Attendance = require("../models/Attendance.model");
const AuditLog = require("../models/AuditLog.model");

// @desc    Get all events
// @route   GET /api/events
// @access  Public/Private
exports.getEvents = async (req, res) => {
  try {
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    // Build filter
    const filter = {};

    // Date range filter
    if (req.query.startDate || req.query.endDate) {
      filter.startDate = {};
      if (req.query.startDate) filter.startDate.$gte = new Date(req.query.startDate);
      if (req.query.endDate) filter.startDate.$lte = new Date(req.query.endDate);
    }

    // Apply other filters
    if (req.query.type) filter.type = req.query.type;
    if (req.query.category) filter.category = req.query.category;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.createdBy) filter.createdBy = req.query.createdBy;
    
    // Location filter
    if (req.query.location) {
      filter.location = { $regex: req.query.location, $options: "i" };
    }

    // Search
    if (req.query.search) {
      filter.$or = [
        { title: { $regex: req.query.search, $options: "i" } },
        { description: { $regex: req.query.search, $options: "i" } },
        { venue: { $regex: req.query.search, $options: "i" } }
      ];
    }

    // Visibility for non-admins
    if (req.user?.role !== "admin") {
      filter.isPublic = true;
      filter.status = { $in: ["Published", "Ongoing", "Completed"] };
    }

    // Sorting
    let sort = { startDate: 1 };
    if (req.query.sortBy) {
      const parts = req.query.sortBy.split(":");
      sort = { [parts[0]]: parts[1] === "desc" ? -1 : 1 };
    }

    // Execute query
    const events = await Event.find(filter)
      .populate("createdBy", "name email")
      .populate("organizers", "name")
      .skip(skip)
      .limit(limit)
      .sort(sort)
      .lean();

    // Check registration status for logged-in users
    if (req.user) {
      for (const event of events) {
        event.isRegistered = event.attendees?.some(
          attendee => attendee.user?.toString() === req.user.id
        );
        
        // Remove sensitive data
        delete event.attendees;
        delete event.feedback;
      }
    }

    const total = await Event.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: events.length,
      total,
      pagination: {
        page,
        limit,
        pages: Math.ceil(total / limit),
        next: page * limit < total ? page + 1 : null,
        prev: page > 1 ? page - 1 : null
      },
      data: events
    });
  } catch (error) {
    console.error("Get events error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch events"
    });
  }
};

// @desc    Get single event
// @route   GET /api/events/:id
// @access  Public/Private
exports.getEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate("createdBy", "name email profileImage")
      .populate("organizers", "name email profileImage")
      .populate("attendees.user", "name studentId department profileImage")
      .populate("feedback.user", "name profileImage")
      .lean();

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found"
      });
    }

    // Check permissions (public or admin/creator)
    if (!event.isPublic && 
        req.user?.role !== "admin" && 
        req.user?.id !== event.createdBy?._id?.toString()) {
      return res.status(403).json({
        success: false,
        message: "Event is not public"
      });
    }

    // Check registration status for logged-in users
    if (req.user) {
      event.isRegistered = event.attendees?.some(
        attendee => attendee.user?._id?.toString() === req.user.id
      );
      
      event.isAttended = event.attendees?.some(
        attendee => attendee.user?._id?.toString() === req.user.id && 
                   attendee.status === "Attended"
      );
    }

    res.status(200).json({
      success: true,
      data: event
    });
  } catch (error) {
    console.error("Get event error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch event"
    });
  }
};

// @desc    Create event (Admin only)
// @route   POST /api/events
// @access  Private/Admin
exports.createEvent = async (req, res) => {
  try {
    // Add createdBy from authenticated user
    const eventData = {
      ...req.body,
      createdBy: req.user.id
    };

    // Set publishedAt if publishing
    if (req.body.status === "Published" && !req.body.publishedAt) {
      eventData.publishedAt = new Date();
    }

    const event = await Event.create(eventData);

    // Populate for response
    await event.populate("createdBy", "name email");

    // Log the action
    await AuditLog.log({
      userId: req.user.id,
      action: "create",
      resource: "Event",
      resourceId: event._id,
      resourceName: event.title,
      changes: {
        after: {
          title: event.title,
          type: event.type,
          status: event.status,
          startDate: event.startDate
        }
      },
      ipAddress: req.ip,
      userAgent: req.get("user-agent")
    });

    res.status(201).json({
      success: true,
      message: "Event created successfully",
      data: event
    });
  } catch (error) {
    console.error("Create event error:", error);
    
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: messages.join(", ")
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to create event"
    });
  }
};

// @desc    Update event
// @route   PUT /api/events/:id
// @access  Private/Admin
exports.updateEvent = async (req, res) => {
  try {
    let event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found"
      });
    }

    // Check permissions (admin or creator)
    if (req.user.role !== "admin" && req.user.id !== event.createdBy.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this event"
      });
    }

    // Store old data for audit
    const oldData = {
      title: event.title,
      type: event.type,
      status: event.status,
      startDate: event.startDate
    };

    // Set publishedAt if publishing for the first time
    if (req.body.status === "Published" && event.status !== "Published") {
      req.body.publishedAt = new Date();
    }

    // Update event
    event = await Event.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    )
    .populate("createdBy", "name email")
    .populate("organizers", "name");

    // Log the action
    await AuditLog.log({
      userId: req.user.id,
      action: "update",
      resource: "Event",
      resourceId: event._id,
      resourceName: event.title,
      changes: {
        before: oldData,
        after: {
          title: event.title,
          type: event.type,
          status: event.status,
          startDate: event.startDate
        },
        fields: Object.keys(req.body)
      },
      ipAddress: req.ip,
      userAgent: req.get("user-agent")
    });

    res.status(200).json({
      success: true,
      message: "Event updated successfully",
      data: event
    });
  } catch (error) {
    console.error("Update event error:", error);
    
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: messages.join(", ")
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to update event"
    });
  }
};

// @desc    Delete event
// @route   DELETE /api/events/:id
// @access  Private/Admin
exports.deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found"
      });
    }

    // Check permissions (admin or creator)
    if (req.user.role !== "admin" && req.user.id !== event.createdBy.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this event"
      });
    }

    // Store data for audit
    const eventData = {
      title: event.title,
      createdBy: event.createdBy,
      startDate: event.startDate
    };

    // Delete associated attendances
    await Attendance.deleteMany({ event: event._id });

    // Delete event
    await event.deleteOne();

    // Log the action
    await AuditLog.log({
      userId: req.user.id,
      action: "delete",
      resource: "Event",
      resourceId: event._id,
      resourceName: event.title,
      changes: {
        before: eventData
      },
      ipAddress: req.ip,
      userAgent: req.get("user-agent")
    });

    res.status(200).json({
      success: true,
      message: "Event deleted successfully",
      data: {}
    });
  } catch (error) {
    console.error("Delete event error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete event"
    });
  }
};

// @desc    Register for event
// @route   POST /api/events/:id/register
// @access  Private
exports.registerForEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found"
      });
    }

    // Check if event is available for registration
    if (event.status !== "Published") {
      return res.status(400).json({
        success: false,
        message: "Event is not available for registration"
      });
    }

    // Check if event is full
    if (event.isFull) {
      return res.status(400).json({
        success: false,
        message: "Event is full"
      });
    }

    // Check if already registered
    const isRegistered = event.attendees.some(
      attendee => attendee.user.toString() === req.user.id
    );

    if (isRegistered) {
      return res.status(400).json({
        success: false,
        message: "Already registered for this event"
      });
    }

    // Register user
    await event.registerUser(req.user.id);

    // Log the action
    await AuditLog.log({
      userId: req.user.id,
      action: "register",
      resource: "Event",
      resourceId: event._id,
      resourceName: event.title,
      changes: {
        after: { registered: true }
      },
      ipAddress: req.ip,
      userAgent: req.get("user-agent")
    });

    res.status(200).json({
      success: true,
      message: "Successfully registered for event",
      data: {
        eventId: event._id,
        title: event.title,
        registeredAt: new Date()
      }
    });
  } catch (error) {
    console.error("Register for event error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to register for event"
    });
  }
};

// @desc    Check in to event
// @route   POST /api/events/:id/checkin
// @access  Private
exports.checkInToEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found"
      });
    }

    // Check if event is ongoing
    if (event.status !== "Ongoing") {
      return res.status(400).json({
        success: false,
        message: "Event is not ongoing"
      });
    }

    // Check if user is registered
    const isRegistered = event.attendees.some(
      attendee => attendee.user.toString() === req.user.id
    );

    if (!isRegistered) {
      return res.status(400).json({
        success: false,
        message: "You must register for the event first"
      });
    }

    // Check in user
    await event.checkInUser(req.user.id);

    // Create attendance record
    const attendance = await Attendance.create({
      user: req.user.id,
      event: event._id,
      eventName: event.title,
      eventType: event.type,
      date: new Date(),
      status: "Present",
      location: event.location,
      verifiedBy: req.user.id
    });

    // Log the action
    await AuditLog.log({
      userId: req.user.id,
      action: "update",
      resource: "Event",
      resourceId: event._id,
      resourceName: event.title,
      changes: {
        after: { checkedIn: true }
      },
      ipAddress: req.ip,
      userAgent: req.get("user-agent")
    });

    res.status(200).json({
      success: true,
      message: "Checked in successfully",
      data: {
        eventId: event._id,
        title: event.title,
        checkInTime: new Date(),
        attendanceId: attendance._id
      }
    });
  } catch (error) {
    console.error("Check in to event error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to check in to event"
    });
  }
};

// @desc    Submit event feedback
// @route   POST /api/events/:id/feedback
// @access  Private
exports.submitFeedback = async (req, res) => {
  try {
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5"
      });
    }

    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found"
      });
    }

    // Check if user attended the event
    const hasAttended = event.attendees.some(
      attendee => attendee.user.toString() === req.user.id && 
                 attendee.status === "Attended"
    );

    if (!hasAttended) {
      return res.status(400).json({
        success: false,
        message: "You must attend the event before submitting feedback"
      });
    }

    // Check if already submitted feedback
    const existingFeedbackIndex = event.feedback.findIndex(
      fb => fb.user.toString() === req.user.id
    );

    if (existingFeedbackIndex > -1) {
      // Update existing feedback
      event.feedback[existingFeedbackIndex].rating = rating;
      event.feedback[existingFeedbackIndex].comment = comment;
    } else {
      // Add new feedback
      event.feedback.push({
        user: req.user.id,
        rating,
        comment
      });
    }

    await event.save();

    res.status(200).json({
      success: true,
      message: existingFeedbackIndex > -1 ? "Feedback updated" : "Feedback submitted",
      data: {
        rating,
        comment,
        averageRating: event.averageRating
      }
    });
  } catch (error) {
    console.error("Submit feedback error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to submit feedback"
    });
  }
};

// @desc    Get upcoming events
// @route   GET /api/events/upcoming
// @access  Public
exports.getUpcomingEvents = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    
    const events = await Event.getUpcomingEvents(limit);

    res.status(200).json({
      success: true,
      count: events.length,
      data: events
    });
  } catch (error) {
    console.error("Get upcoming events error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch upcoming events"
    });
  }
};

// @desc    Get user's registered events
// @route   GET /api/events/my-events
// @access  Private
exports.getMyEvents = async (req, res) => {
  try {
    const events = await Event.find({
      "attendees.user": req.user.id
    })
    .populate("createdBy", "name email")
    .sort({ startDate: 1 })
    .lean();

    // Add attendance status
    const eventsWithStatus = events.map(event => ({
      ...event,
      attendanceStatus: event.attendees.find(
        attendee => attendee.user.toString() === req.user.id
      )?.status || "Registered"
    }));

    res.status(200).json({
      success: true,
      count: events.length,
      data: eventsWithStatus
    });
  } catch (error) {
    console.error("Get my events error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch your events"
    });
  }
};

// @desc    Get event statistics
// @route   GET /api/events/stats
// @access  Private/Admin
exports.getEventStats = async (req, res) => {
  try {
    // Overall statistics
    const overallStats = await Event.aggregate([
      {
        $group: {
          _id: null,
          totalEvents: { $sum: 1 },
          publishedEvents: {
            $sum: { $cond: [{ $eq: ["$status", "Published"] }, 1, 0] }
          },
          ongoingEvents: {
            $sum: { $cond: [{ $eq: ["$status", "Ongoing"] }, 1, 0] }
          },
          completedEvents: {
            $sum: { $cond: [{ $eq: ["$status", "Completed"] }, 1, 0] }
          },
          totalRegistrations: { $sum: "$totalRegistrations" },
          totalAttendance: { $sum: "$totalAttendance" },
          averageRating: { $avg: "$averageRating" }
        }
      },
      {
        $project: {
          _id: 0,
          totalEvents: 1,
          publishedEvents: 1,
          ongoingEvents: 1,
          completedEvents: 1,
          totalRegistrations: 1,
          totalAttendance: 1,
          attendanceRate: {
            $cond: [
              { $gt: ["$totalRegistrations", 0] },
              {
                $multiply: [
                  { $divide: ["$totalAttendance", "$totalRegistrations"] },
                  100
                ]
              },
              0
            ]
          },
          averageRating: { $round: ["$averageRating", 2] }
        }
      }
    ]);

    // Event type statistics
    const typeStats = await Event.aggregate([
      {
        $group: {
          _id: "$type",
          count: { $sum: 1 },
          totalRegistrations: { $sum: "$totalRegistrations" },
          averageRating: { $avg: "$averageRating" }
        }
      },
      {
        $project: {
          type: "$_id",
          count: 1,
          totalRegistrations: 1,
          averageRating: { $round: ["$averageRating", 2] }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Monthly event trend
    const monthlyTrend = await Event.aggregate([
      {
        $group: {
          _id: {
            year: { $year: "$startDate" },
            month: { $month: "$startDate" }
          },
          count: { $sum: 1 },
          totalRegistrations: { $sum: "$totalRegistrations" }
        }
      },
      {
        $project: {
          year: "$_id.year",
          month: "$_id.month",
          count: 1,
          totalRegistrations: 1
        }
      },
      { $sort: { year: -1, month: -1 } },
      { $limit: 12 }
    ]);

    // Popular events
    const popularEvents = await Event.find({ status: "Published" })
      .select("title type startDate totalRegistrations averageRating")
      .sort({ totalRegistrations: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      data: {
        overall: overallStats[0] || {
          totalEvents: 0,
          publishedEvents: 0,
          ongoingEvents: 0,
          completedEvents: 0,
          totalRegistrations: 0,
          totalAttendance: 0,
          attendanceRate: 0,
          averageRating: 0
        },
        byType: typeStats,
        monthlyTrend,
        popularEvents
      }
    });
  } catch (error) {
    console.error("Get event stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch event statistics"
    });
  }
};