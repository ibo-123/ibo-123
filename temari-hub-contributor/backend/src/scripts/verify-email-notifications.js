const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const emailService = require('../services/emailService');
const notificationService = require('../services/notificationService');
const User = require('../models/User');
const Notification = require('../models/Notification');
const Job = require('../models/Job');

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests += 1;
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  passedTests += 1;
  console.log(`✅ PASS: ${message}`);
}

async function runTests() {
  console.log('\n======================================================');
  console.log('TESTING RESEND EMAIL NOTIFICATIONS INTEGRATION');
  console.log('======================================================\n');

  // --- 1. Email Service Unit Verification ---
  console.log('--- 1. Email Service & Template Engine ---');

  // URL resolution
  const absUrl = emailService.resolveActionUrl('/contributor/jobs/123');
  assert(absUrl.startsWith('http') && absUrl.endsWith('/contributor/jobs/123'), 'resolveActionUrl converts relative path to absolute frontend URL');

  // HTML Template building
  const html = emailService.buildHtmlTemplate({
    recipientName: 'Abebe Kebede',
    title: 'New Job Assigned',
    message: 'You have been assigned a new Mathematics question creation task.',
    actionUrl: '/contributor/jobs/abc123',
    actionText: 'View Job Details',
    details: {
      'Job Title': 'Grade 11 Calculus Questions',
      'Subject': 'MATHEMATICS',
      'Deadline': 'Oct 15, 2026',
    },
  });

  assert(html.includes('TEMARI<span style="color: #38bdf8;">HUB</span>'), 'Template contains TemariHub branding');
  assert(html.includes('Hello Abebe Kebede,'), 'Template contains personalized greeting');
  assert(html.includes('Grade 11 Calculus Questions'), 'Template contains details table');
  assert(html.includes('View Job Details'), 'Template contains CTA button text');
  assert(html.includes('http'), 'Template contains resolved absolute action URL');

  // Plain Text building
  const text = emailService.buildPlainText({
    recipientName: 'Abebe Kebede',
    title: 'New Job Assigned',
    message: 'You have been assigned a new task.',
    actionUrl: '/contributor/jobs/abc123',
    actionText: 'View Job Details',
  });
  assert(text.includes('TEMARIHUB CONTRIBUTOR PLATFORM'), 'Plain text contains platform header');
  assert(text.includes('View Job Details: http'), 'Plain text includes absolute link');

  // Missing API key handling
  const originalKey = process.env.RESEND_API_KEY;
  delete process.env.RESEND_API_KEY;
  const noKeyResult = await emailService.sendEmail({
    to: 'test@example.com',
    subject: 'Test without key',
    html: '<p>test</p>',
    text: 'test',
  });
  assert(noKeyResult.skipped === true && noKeyResult.success === false, 'Gracefully skips email delivery when RESEND_API_KEY is not configured');
  process.env.RESEND_API_KEY = originalKey;

  // Invalid email validation
  const invalidEmailResult = await emailService.sendEmail({
    to: 'notanemail',
    subject: 'Test',
    html: '<p>test</p>',
    text: 'test',
  });
  assert(invalidEmailResult.success === false && invalidEmailResult.error.includes('Invalid recipient'), 'Rejects malformed recipient email without throwing');

  // --- 2. Database & Notification Service Integration ---
  console.log('\n--- 2. Database Integration & Preferences ---');
  let dbConnected = false;
  try {
    await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 3000 });
    dbConnected = true;
  } catch (err) {
    try { await mongoose.disconnect(); } catch (_) {}
    console.log('⚠️ Live MongoDB Atlas unreachable in current environment (' + err.message + ').');
    console.log('Testing with mock User/Notification entities...');
  }

  if (dbConnected) {
    // Find or create test contributor and admin
    const contributorEmail = (process.env.CONTRIBUTOR_EMAIL || 'contributor@example.com').toLowerCase();
    let testContributor = await User.findOne({ email: contributorEmail });
    if (!testContributor) {
      testContributor = await User.create({
        name: process.env.CONTRIBUTOR_NAME || 'Contributor Test User',
        email: contributorEmail,
        password: 'Password123!',
        role: 'CONTRIBUTOR',
        contributorRole: 'QUESTION_CREATOR',
        subject: 'MATHEMATICS',
        academicVerificationStatus: 'VERIFIED',
      });
    }

    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@example.com').toLowerCase();
    let testAdmin = await User.findOne({ email: adminEmail });
    if (!testAdmin) {
      testAdmin = await User.create({
        name: process.env.ADMIN_NAME || 'Admin Test User',
        email: adminEmail,
        password: 'Password123!',
        role: 'ADMIN',
      });
    }

    // Preferences Test
    const prefs = await notificationService.getPreferences(testContributor);
    assert(prefs.emailNotifications === true && prefs.inAppNotifications === true, 'Default notification preferences are enabled');

    // Toggle preferences
    const updatedPrefs = await notificationService.updatePreferences(testContributor, {
      emailNotifications: false,
      inAppNotifications: true,
    });
    assert(updatedPrefs.emailNotifications === false, 'Successfully updated preferences: emailNotifications = false');

    // Test that email is skipped when user has disabled email notifications
    const mockJob = {
      _id: new mongoose.Types.ObjectId(),
      title: 'Algebra Review Job',
      subject: 'MATHEMATICS',
      topic: 'Quadratic Equations',
      deadline: new Date(Date.now() + 86400000),
      quantity: 5,
    };

    const notifDisabled = await notificationService.notifyJobAssigned(testContributor._id, mockJob);
    assert(notifDisabled && notifDisabled.type === 'JOB_ASSIGNED', 'In-app notification created when email preferences disabled');
    const notifDoc = await Notification.findById(notifDisabled._id);
    assert(notifDoc.emailSent === false, 'Email was not sent because preference was disabled');

    // Re-enable email preferences
    await notificationService.updatePreferences(testContributor, {
      emailNotifications: true,
      inAppNotifications: true,
    });

    // --- 3. Notification Types Coverage ---
    console.log('\n--- 3. Notification Event Types ---');

    // Event A: Job Assigned
    const jobAssignedNotif = await notificationService.notifyJobAssigned(testContributor._id, mockJob);
    assert(jobAssignedNotif.type === 'JOB_ASSIGNED', 'notifyJobAssigned creates in-app notification');
    assert(jobAssignedNotif.link.includes('/contributor/jobs/'), 'notifyJobAssigned sets correct contributor job link');

    // Event B: Submission Received
    const subRecvNotif = await notificationService.notifySubmissionReceived({
      adminId: testAdmin._id,
      contributorName: testContributor.name,
      job: mockJob,
      submissionId: new mongoose.Types.ObjectId(),
      resubmitted: false,
    });
    assert(subRecvNotif.type === 'SUBMISSION_RECEIVED', 'notifySubmissionReceived creates in-app notification');
    assert(subRecvNotif.link.includes('/admin/submissions/'), 'notifySubmissionReceived sets correct admin submission link');

    // Event C: Revision Requested
    const revNotif = await notificationService.notifyRevisionRequested(
      testContributor._id,
      mockJob,
      new mongoose.Types.ObjectId(),
      'Please add detailed explanations for option D.',
    );
    assert(revNotif.type === 'REVISION_REQUESTED', 'notifyRevisionRequested creates in-app notification');
    assert(revNotif.message.includes('detailed explanations'), 'notifyRevisionRequested includes feedback');

    // Event D: Submission Approved
    const appNotif = await notificationService.notifySubmissionApproved(
      testContributor._id,
      mockJob,
      new mongoose.Types.ObjectId(),
    );
    assert(appNotif.type === 'SUBMISSION_APPROVED', 'notifySubmissionApproved creates in-app notification');

    // Event E: Deadline Reminder
    const reminderJob = await Job.create({
      title: 'Urgent Physics Solutions',
      description: 'Solve physics set',
      requirements: 'Complete all steps',
      subject: 'PHYSICS',
      topic: 'Kinematics',
      quantity: 10,
      difficulty: 'MEDIUM',
      deadline: new Date(Date.now() + 12 * 60 * 60 * 1000), // 12 hours from now
      instructions: 'Follow guidelines',
      status: 'ASSIGNED',
      contributor: testContributor._id,
      createdBy: testAdmin._id,
    });

    const reminderResult = await notificationService.runDeadlineReminders();
    assert(reminderResult.created >= 1, 'runDeadlineReminders successfully triggered reminder notification');
    await Job.deleteOne({ _id: reminderJob._id });

    // --- 4. Fault Tolerance: Email Failure Never Breaks Business Logic ---
    console.log('\n--- 4. Fault Tolerance & Non-blocking Error Handling ---');

    process.env.RESEND_API_KEY = 're_invalid_test_key_1234567890';
    let notificationCreated = false;
    try {
      const fallbackNotif = await notificationService.notifyJobAssigned(testContributor._id, {
        _id: new mongoose.Types.ObjectId(),
        title: 'Fault Tolerance Test Job',
        subject: 'CHEMISTRY',
      });
      if (fallbackNotif && fallbackNotif._id) {
        notificationCreated = true;
        const stored = await Notification.findById(fallbackNotif._id);
        assert(stored !== null, 'In-app notification persisted despite email failure');
        assert(stored.emailSent === false, 'emailSent is false on Resend failure');
        assert(Boolean(stored.emailError), 'emailError recorded failure details for auditing');
      }
    } catch (err) {
      console.error('Unexpected throw during email failure:', err);
    }
    assert(notificationCreated === true, 'Core operation succeeded even when email delivery failed');
    process.env.RESEND_API_KEY = originalKey;

    // --- 5. Security Verification ---
    console.log('\n--- 5. Security & Sensitive Data Leak Checks ---');
    const safeUser = testAdmin.toSafeObject();
    assert(!safeUser.password, 'toSafeObject() does not expose password');
    assert(!JSON.stringify(safeUser).includes('re_'), 'User serialization never includes Resend API key');
    assert(!JSON.stringify(subRecvNotif).includes('re_'), 'Notification serialization never includes Resend API key');

    // Clean up test notifications
    await Notification.deleteMany({
      _id: { $in: [notifDisabled._id, jobAssignedNotif._id, subRecvNotif._id, revNotif._id, appNotif._id] },
    });
  } else {
    // Offline / Sandboxed Mock Checks
    const mockUser = new User({
      name: 'Mock Contributor',
      email: 'mock@example.com',
      password: 'HashedPassword123!',
      role: 'CONTRIBUTOR',
      contributorRole: 'QUESTION_CREATOR',
      subject: 'MATHEMATICS',
      academicVerificationStatus: 'VERIFIED',
    });

    const prefs = await notificationService.getPreferences(mockUser);
    assert(prefs.emailNotifications === true && prefs.inAppNotifications === true, 'Default notification preferences are enabled');

    const updated = await notificationService.updatePreferences(mockUser, { emailNotifications: false });
    assert(updated.emailNotifications === false, 'Successfully updated preferences: emailNotifications = false');

    const safeUser = mockUser.toSafeObject();
    assert(!safeUser.password, 'toSafeObject() does not expose password');
    assert(!JSON.stringify(safeUser).includes('re_'), 'User serialization never includes Resend API key');

    // Mock notification object check
    const mockNotif = new Notification({
      recipient: mockUser._id,
      title: 'Job Assigned',
      message: 'You have been assigned a job.',
      type: 'JOB_ASSIGNED',
      link: '/contributor/jobs/123',
      emailSent: false,
    });
    assert(!JSON.stringify(mockNotif).includes('re_'), 'Notification serialization never includes Resend API key');
    assert(mockNotif.emailSent === false, 'Notification has emailSent tracking flag');
  }

  console.log('\n======================================================');
  console.log(`ALL EMAIL NOTIFICATION TESTS PASSED: ${passedTests}/${totalTests}`);
  console.log('======================================================\n');
  process.exit(0);
}

runTests().catch((err) => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
