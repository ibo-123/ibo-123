const asyncHandler = require('../utils/asyncHandler');
const Job = require('../models/Job');
const Submission = require('../models/Submission');
const ActivityLog = require('../models/ActivityLog');

const adminDashboard = asyncHandler(async (req, res) => {
  const [
    totalJobs,
    openJobs,
    pendingSubmissions,
    revisionSubmissions,
    approvedSubmissions,
  ] = await Promise.all([
    Job.countDocuments(),
    Job.countDocuments({ status: { $in: ['ASSIGNED', 'IN_PROGRESS'] } }),
    Submission.countDocuments({ status: { $in: ['SUBMITTED', 'UNDER_REVIEW'] } }),
    Submission.countDocuments({ status: 'REVISION_REQUIRED' }),
    Submission.countDocuments({ status: { $in: ['APPROVED', 'CONTENT_READY'] } }),
  ]);

  res.json({
    success: true,
    data: {
      message: `Welcome, ${req.user.name}`,
      name: req.user.name,
      role: req.user.role,
      stats: {
        totalJobs,
        openJobs,
        pendingSubmissions,
        revisionSubmissions,
        approvedSubmissions,
      },
    },
  });
});

const contributorDashboard = asyncHandler(async (req, res) => {
  const contributorId = req.user._id;

  const [
    assignedJobsCount,
    activeJobsCount,
    pendingSubmissionsCount,
    revisionRequiredSubmissionsCount,
    approvedSubmissionsCount,
    upcomingDeadlineJobs,
    recentActivities,
  ] = await Promise.all([
    Job.countDocuments({
      contributor: contributorId,
      status: 'ASSIGNED',
    }),
    Job.countDocuments({
      contributor: contributorId,
      status: { $in: ['ASSIGNED', 'IN_PROGRESS'] },
    }),
    Submission.countDocuments({
      contributor: contributorId,
      status: { $in: ['SUBMITTED', 'UNDER_REVIEW'] },
    }),
    Submission.countDocuments({
      contributor: contributorId,
      status: 'REVISION_REQUIRED',
    }),
    Submission.countDocuments({
      contributor: contributorId,
      status: { $in: ['APPROVED', 'CONTENT_READY'] },
    }),
    Job.find({
      contributor: contributorId,
      status: { $in: ['ASSIGNED', 'IN_PROGRESS'] },
    })
      .sort({ deadline: 1 })
      .limit(5)
      .lean(),
    ActivityLog.find({
      $or: [{ actor: contributorId }, { 'metadata.contributorId': contributorId }],
    })
      .sort({ createdAt: -1 })
      .limit(6)
      .populate('actor', 'name')
      .lean(),
  ]);

  res.json({
    success: true,
    data: {
      message: `Welcome, ${req.user.name}`,
      name: req.user.name,
      role: req.user.role,
      metrics: {
        assignedJobs: assignedJobsCount,
        activeJobs: activeJobsCount,
        pendingSubmissions: pendingSubmissionsCount,
        submissionsRequiringRevision: revisionRequiredSubmissionsCount,
        approvedSubmissions: approvedSubmissionsCount,
      },
      upcomingDeadlines: upcomingDeadlineJobs.map((job) => ({
        id: job._id,
        title: job.title,
        subject: job.subject,
        topic: job.topic,
        deadline: job.deadline,
        status: job.status,
      })),
      recentActivity: recentActivities.map((act) => ({
        id: act._id,
        action: act.action,
        description: act.description,
        createdAt: act.createdAt,
        actor: act.actor ? { name: act.actor.name } : null,
      })),
    },
  });
});

module.exports = { adminDashboard, contributorDashboard };
