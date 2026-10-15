const mongoose = require('mongoose');
const Job = require('../models/Job');
const Notification = require('../models/Notification');
const Submission = require('../models/Submission');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const emailService = require('./emailService');

const OBJECT_ID_PATTERN = /^[a-fA-F0-9]{24}$/;
const REMINDER_CHECK_MS = 15 * 60 * 1000;
const OPEN_REMINDER_SUBMISSION_STATUSES = ['DRAFT', 'REVISION_REQUIRED'];

function reminderHours() {
  const parsed = Number(process.env.DEADLINE_REMINDER_HOURS);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 24;
  }
  return parsed;
}

function formatDate(dateValue) {
  if (!dateValue) return '—';
  const d = new Date(dateValue);
  if (Number.isNaN(d.getTime())) return String(dateValue);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function serializeNotification(notification) {
  return {
    id: notification._id,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    relatedEntityType: notification.relatedEntityType,
    relatedEntityId: notification.relatedEntityId,
    link: notification.link || '',
    isRead: notification.isRead,
    emailSent: Boolean(notification.emailSent),
    emailSentAt: notification.emailSentAt || null,
    createdAt: notification.createdAt,
  };
}

async function createNotification(input) {
  const notification = await Notification.create(input);
  return notification;
}

/**
 * Delivers email for a notification safely without throwing errors.
 * Email delivery failure will never interrupt or fail the core business logic.
 */
async function deliverNotificationEmail(notification, { emailSubject, emailTitle, actionText, details } = {}) {
  if (!notification || !notification.recipient) return;

  try {
    const user = await User.findById(notification.recipient).select('name email notificationPreferences');
    if (!user) {
      console.warn(`[Email] Skipping email notification: recipient user ${notification.recipient} not found in database.`);
      return;
    }

    if (!user.email || !user.email.includes('@')) {
      console.warn(`[Email] Skipping email notification: user ${user._id} (${user.name}) has no valid email.`);
      return;
    }

    if (user.notificationPreferences?.emailNotifications === false) {
      console.log(`[Email] Skipping email notification: user ${user.email} has disabled email notifications in preferences.`);
      return;
    }

    const result = await emailService.sendNotificationEmail({
      to: user.email,
      recipientName: user.name,
      subject: emailSubject || `${notification.title} — TemariHub`,
      title: emailTitle || notification.title,
      message: notification.message,
      actionUrl: notification.link,
      actionText: actionText || 'View Details',
      details,
      notificationType: notification.type,
    });

    if (result.success) {
      await Notification.updateOne(
        { _id: notification._id },
        { emailSent: true, emailSentAt: new Date(), emailError: null },
      ).catch(() => {});
    } else if (!result.skipped) {
      await Notification.updateOne(
        { _id: notification._id },
        { emailSent: false, emailError: result.error || 'Email delivery failed' },
      ).catch(() => {});
    }
  } catch (err) {
    console.error(`[Email] Unexpected error during notification email delivery:`, err.message || err);
    await Notification.updateOne(
      { _id: notification._id },
      { emailSent: false, emailError: err.message || 'Unexpected email error' },
    ).catch(() => {});
  }
}

async function notifyJobAssigned(contributorId, job) {
  const notification = await createNotification({
    recipient: contributorId,
    type: 'JOB_ASSIGNED',
    title: 'New Job Assigned',
    message: `You have been assigned a new job: ${job.title}.`,
    relatedEntityType: 'Job',
    relatedEntityId: job._id,
    link: `/contributor/jobs/${job._id}`,
  });

  const details = {
    'Job Title': job.title,
    'Subject': job.subject,
    ...(job.topic ? { 'Topic': job.topic } : {}),
    ...(job.deadline ? { 'Deadline': formatDate(job.deadline) } : {}),
    ...(job.quantity ? { 'Required Quantity': job.quantity } : {}),
  };

  await deliverNotificationEmail(notification, {
    emailSubject: 'New Job Assigned — TemariHub',
    emailTitle: 'New Job Assigned',
    actionText: 'View Job Details',
    details,
  });

  return notification;
}

async function notifySubmissionReceived({ adminId, contributorName, job, submissionId, resubmitted }) {
  const verb = resubmitted ? 'resubmitted' : 'submitted';
  const title = job?.title || 'Topic Resource';
  const notification = await createNotification({
    recipient: adminId,
    type: 'SUBMISSION_RECEIVED',
    title: resubmitted ? 'Submission Updated' : 'New Submission',
    message: `${contributorName} ${verb} the job: ${title}.`,
    relatedEntityType: 'Submission',
    relatedEntityId: submissionId,
    link: `/admin/submissions/${submissionId}`,
  });

  const details = {
    'Contributor': contributorName,
    'Resource / Job': title,
    ...(job?.subject ? { 'Subject': job.subject } : {}),
    'Submission Date': formatDate(new Date()),
    'Status': resubmitted ? 'Resubmitted for Review' : 'Submitted for Review',
  };

  await deliverNotificationEmail(notification, {
    emailSubject: resubmitted ? 'Submission Updated — TemariHub' : 'New Submission Received — TemariHub',
    emailTitle: resubmitted ? 'Submission Updated' : 'New Submission Received',
    actionText: 'Review Submission',
    details,
  });

  return notification;
}

async function submissionRecipients(job) {
  if (job?.createdBy) {
    const owner = await User.findById(job.createdBy).select('role isActive');
    if (owner && owner.role === 'ADMIN' && owner.isActive !== false) {
      return [owner._id];
    }
  }

  const admins = await User.find({ role: 'ADMIN', isActive: { $ne: false } }).select('_id');
  return admins.map((admin) => admin._id);
}

async function notifyAdminsOfSubmission(job, submissionId, contributorName, { resubmitted }) {
  const recipients = await submissionRecipients(job);
  await Promise.all(recipients.map((adminId) => notifySubmissionReceived({
    adminId,
    contributorName,
    job,
    submissionId,
    resubmitted,
  })));
}

async function notifyRevisionRequested(contributorId, job, submissionId, feedback) {
  const detail = feedback ? ` ${feedback}` : '';
  const title = job?.title || 'Topic Resource';
  const link = job?._id ? `/contributor/jobs/${job._id}/submission` : `/contributor/resources/${submissionId}`;
  const notification = await createNotification({
    recipient: contributorId,
    type: 'REVISION_REQUESTED',
    title: 'Revision Requested',
    message: `Revision requested for: ${title}.${detail}`,
    relatedEntityType: 'Submission',
    relatedEntityId: submissionId,
    link,
  });

  const details = {
    'Work Item': title,
    ...(job?.subject ? { 'Subject': job.subject } : {}),
    'Reviewer Feedback': feedback || 'Please see the comments and make the required changes.',
    ...(job?.deadline ? { 'Deadline': formatDate(job.deadline) } : {}),
  };

  await deliverNotificationEmail(notification, {
    emailSubject: 'Revision Requested — TemariHub',
    emailTitle: 'Revision Requested',
    actionText: 'Revise Submission',
    details,
  });

  return notification;
}

async function notifySubmissionApproved(contributorId, job, submissionId) {
  const title = job?.title || 'Topic Resource';
  const link = job?._id ? `/contributor/jobs/${job._id}/submission` : `/contributor/resources/${submissionId}`;
  const notification = await createNotification({
    recipient: contributorId,
    type: 'SUBMISSION_APPROVED',
    title: 'Submission Approved',
    message: `Your submission for ${title} has been approved.`,
    relatedEntityType: 'Submission',
    relatedEntityId: submissionId,
    link,
  });

  const details = {
    'Work Item': title,
    ...(job?.subject ? { 'Subject': job.subject } : {}),
    'Status': 'Approved',
    'Approved At': formatDate(new Date()),
  };

  await deliverNotificationEmail(notification, {
    emailSubject: 'Submission Approved — TemariHub',
    emailTitle: 'Submission Approved',
    actionText: 'View Submission',
    details,
  });

  return notification;
}

async function listForUser(user) {
  const [notifications, unreadCount] = await Promise.all([
    Notification.find({ recipient: user._id }).sort({ createdAt: -1, _id: -1 }).limit(50),
    Notification.countDocuments({ recipient: user._id, isRead: false }),
  ]);

  return {
    notifications: notifications.map(serializeNotification),
    unreadCount,
  };
}

async function markRead(user, id) {
  if (typeof id !== 'string' || !OBJECT_ID_PATTERN.test(id)) {
    throw new AppError(400, 'Invalid notification ID');
  }

  const notification = await Notification.findOneAndUpdate(
    { _id: id, recipient: user._id },
    { isRead: true },
    { returnDocument: 'after' },
  );

  if (!notification) {
    throw new AppError(404, 'Notification not found');
  }

  return serializeNotification(notification);
}

async function markAllRead(user) {
  await Notification.updateMany({ recipient: user._id, isRead: false }, { isRead: true });
  return { unreadCount: 0 };
}

async function getPreferences(user) {
  if (user?.notificationPreferences) {
    return {
      emailNotifications: user.notificationPreferences.emailNotifications !== false,
      inAppNotifications: user.notificationPreferences.inAppNotifications !== false,
    };
  }
  const record = await User.findById(user._id).select('notificationPreferences');
  return {
    emailNotifications: record?.notificationPreferences?.emailNotifications !== false,
    inAppNotifications: record?.notificationPreferences?.inAppNotifications !== false,
  };
}

async function updatePreferences(user, preferences = {}) {
  const emailNotifications = preferences.emailNotifications !== false;
  const inAppNotifications = preferences.inAppNotifications !== false;

  if (mongoose.connection.readyState === 1) {
    await User.updateOne(
      { _id: user._id },
      {
        $set: {
          'notificationPreferences.emailNotifications': emailNotifications,
          'notificationPreferences.inAppNotifications': inAppNotifications,
        },
      },
    );
  }

  if (user.notificationPreferences) {
    user.notificationPreferences.emailNotifications = emailNotifications;
    user.notificationPreferences.inAppNotifications = inAppNotifications;
  }

  return { emailNotifications, inAppNotifications };
}

function reminderMessage(job, hours) {
  if (hours === 24) {
    return `Your job '${job.title}' is due tomorrow.`;
  }
  return `Your job '${job.title}' is due within ${hours} hours.`;
}

async function runDeadlineReminders(now = new Date()) {
  const hours = reminderHours();
  const horizon = new Date(now.getTime() + hours * 60 * 60 * 1000);
  const jobs = await Job.find({
    status: { $in: ['ASSIGNED', 'IN_PROGRESS'] },
    contributor: { $ne: null },
    deadline: { $gt: now, $lte: horizon },
  });

  let created = 0;

  for (const job of jobs) {
    const submission = await Submission.findOne({ job: job._id }).select('status');
    if (submission && !OPEN_REMINDER_SUBMISSION_STATUSES.includes(submission.status)) {
      continue;
    }

    const reminderKey = String(hours);
    const existing = await Notification.findOne({
      recipient: job.contributor,
      type: 'DEADLINE_REMINDER',
      relatedEntityType: 'Job',
      relatedEntityId: job._id,
      reminderKey,
    });
    if (existing) {
      continue;
    }

    try {
      const notification = await createNotification({
        recipient: job.contributor,
        type: 'DEADLINE_REMINDER',
        title: 'Deadline Reminder',
        message: reminderMessage(job, hours),
        relatedEntityType: 'Job',
        relatedEntityId: job._id,
        link: `/contributor/jobs/${job._id}`,
        reminderKey,
      });

      const details = {
        'Job Title': job.title,
        ...(job.subject ? { 'Subject': job.subject } : {}),
        'Deadline': formatDate(job.deadline),
        'Remaining Time': `Due within ${hours} hours`,
      };

      await deliverNotificationEmail(notification, {
        emailSubject: 'Deadline Reminder — TemariHub',
        emailTitle: 'Deadline Reminder',
        actionText: 'View Job Details',
        details,
      });

      created += 1;
    } catch (error) {
      if (error?.code !== 11000) {
        throw error;
      }
    }
  }

  return { created };
}

function startDeadlineReminders() {
  const run = () => {
    runDeadlineReminders().catch((error) => {
      console.error('Deadline reminder check failed:', error.message);
    });
  };

  run();
  const timer = setInterval(run, REMINDER_CHECK_MS);
  if (typeof timer.unref === 'function') {
    timer.unref();
  }
  return timer;
}

module.exports = {
  notifyJobAssigned,
  notifySubmissionReceived,
  notifyAdminsOfSubmission,
  notifyRevisionRequested,
  notifySubmissionApproved,
  listForUser,
  markRead,
  markAllRead,
  getPreferences,
  updatePreferences,
  runDeadlineReminders,
  startDeadlineReminders,
  reminderHours,
  deliverNotificationEmail,
};
