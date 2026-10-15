const Job = require('../models/Job');
const activityService = require('./activityService');
const { notifyJobAssigned } = require('./notificationService');
const Submission = require('../models/Submission');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const { SUBJECTS } = require('../constants/contributors');
const {
  JOB_STATUSES,
  DIFFICULTIES,
  STATUS_TRANSITIONS,
  CREATION_STATUSES,
  ASSIGNED_STATUSES,
  CONTRIBUTOR_VISIBLE_STATUSES,
} = require('../constants/jobs');
const { loadTemplateForJob, snapshotTemplate } = require('./templateService');

const OBJECT_ID_PATTERN = /^[a-fA-F0-9]{24}$/;
const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const ISO_DATE_TIME_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/;

const ADMIN_POPULATE = [
  { path: 'contributor', select: 'name email subject isActive' },
  { path: 'createdBy', select: 'name' },
];

function assertValidId(id, message) {
  if (typeof id !== 'string' || !OBJECT_ID_PATTERN.test(id)) {
    throw new AppError(400, message);
  }
}

// ---------- Serialization ----------

function toAdminJob(job) {
  const contributor = job.contributor;
  const creator = job.createdBy;

  return {
    id: job._id,
    title: job.title,
    description: job.description,
    requirements: job.requirements,
    subject: job.subject,
    topic: job.topic,
    quantity: job.quantity,
    difficulty: job.difficulty,
    deadline: job.deadline,
    instructions: job.instructions,
    status: job.status,
    template: templateSummary(job, true),
    contributor: contributor
      ? {
          id: contributor._id,
          name: contributor.name,
          email: contributor.email,
          subject: contributor.subject,
          isActive: contributor.isActive !== false,
        }
      : null,
    createdBy: creator ? { id: creator._id, name: creator.name } : null,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
  };
}

// Contributors get a clean view with submission progress and job details
function toContributorJob(job, submission = null) {
  let submittedCount = 0;
  if (submission) {
    if (['SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'CONTENT_READY'].includes(submission.status)) {
      submittedCount = job.quantity;
    } else if (submission.items && submission.items.length > 0) {
      submittedCount = submission.items.filter((item) => {
        if (!item.values || typeof item.values !== 'object') return false;
        return Object.values(item.values).some((v) => v !== null && v !== undefined && String(v).trim() !== '');
      }).length;
    } else if (submission.submissionType === 'TOPIC_RESOURCE') {
      submittedCount = 1;
    }
  }

  return {
    id: job._id,
    title: job.title,
    description: job.description,
    requirements: job.requirements,
    subject: job.subject,
    topic: job.topic,
    quantity: job.quantity,
    difficulty: job.difficulty,
    deadline: job.deadline,
    instructions: job.instructions,
    status: job.status,
    template: templateSummary(job, true),
    jobType: job.templateSnapshot?.type || 'RESOURCE',
    assignedDate: job.createdAt,
    submissionProgress: {
      required: job.quantity,
      submitted: submittedCount,
      percentage: Math.min(100, Math.round((submittedCount / (job.quantity || 1)) * 100)),
      submissionStatus: submission ? submission.status : null,
      submissionId: submission ? submission._id : null,
    },
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
  };
}

// ---------- Validation ----------

function parseText(value, label, { required }) {
  if (value === undefined || value === null || value === '') {
    if (required) {
      throw new AppError(400, `${label} is required`);
    }

    return '';
  }

  if (typeof value !== 'string') {
    throw new AppError(400, `${label} must be text`);
  }

  const trimmed = value.trim();
  if (!trimmed && required) {
    throw new AppError(400, `${label} is required`);
  }

  return trimmed;
}

function parseEnum(value, allowed, requiredMessage, invalidMessage) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new AppError(400, requiredMessage);
  }

  if (!allowed.includes(value.trim())) {
    throw new AppError(400, invalidMessage);
  }

  return value.trim();
}

function parseQuantity(value) {
  if (value === undefined || value === null || value === '') {
    throw new AppError(400, 'Quantity is required');
  }

  if (typeof value !== 'number' || !Number.isInteger(value) || value < 1) {
    throw new AppError(400, 'Quantity must be a positive whole number');
  }

  return value;
}

// Deadlines are stored as UTC instants. A date-only value ("2026-10-15") means
// the end of that day in UTC, so every client shows the same calendar day.
function parseDeadline(value) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new AppError(400, 'Deadline is required');
  }

  const input = value.trim();
  let date;

  if (DATE_ONLY_PATTERN.test(input)) {
    date = new Date(`${input}T23:59:59.999Z`);
    if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== input) {
      throw new AppError(400, 'Deadline must be a valid date');
    }
  } else if (ISO_DATE_TIME_PATTERN.test(input)) {
    date = new Date(input);
  } else {
    throw new AppError(400, 'Deadline must be a valid date');
  }

  if (Number.isNaN(date.getTime())) {
    throw new AppError(400, 'Deadline must be a valid date');
  }

  return date;
}

function assertNotInPast(deadline) {
  const now = new Date();
  const startOfTodayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());

  if (deadline.getTime() < startOfTodayUtc) {
    throw new AppError(400, 'Deadline cannot be in the past');
  }
}

function parseJobFields(body) {
  return {
    title: parseText(body?.title, 'Title', { required: true }),
    description: parseText(body?.description, 'Description', { required: true }),
    requirements: parseText(body?.requirements, 'Requirements', { required: false }),
    subject: parseEnum(body?.subject, SUBJECTS, 'Subject is required', 'Invalid subject'),
    topic: parseText(body?.topic, 'Topic', { required: true }),
    quantity: parseQuantity(body?.quantity),
    difficulty: parseEnum(
      body?.difficulty,
      DIFFICULTIES,
      'Difficulty is required',
      'Invalid difficulty',
    ),
    deadline: parseDeadline(body?.deadline),
    instructions: parseText(body?.instructions, 'Instructions', { required: true }),
  };
}

function parseStatus(value) {
  return parseEnum(value, JOB_STATUSES, 'Status is required', 'Invalid job status');
}

// Returns a contributor ID string, or null when the job has no contributor.
function parseContributorId(value) {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  assertValidId(value, 'Invalid contributor ID');
  return value;
}

function templateSummary(job, includeFields) {
  const snapshot = job.templateSnapshot;
  if (!snapshot || !snapshot.name) {
    return null;
  }

  return {
    id: snapshot.templateId,
    name: snapshot.name,
    subject: snapshot.subject,
    type: snapshot.type,
    version: snapshot.version,
    fields: includeFields ? snapshot.fields : undefined,
  };
}

function parseTemplateSelection(value) {
  if (value === undefined) {
    return undefined;
  }

  if (value === null || value === '') {
    return null;
  }

  if (typeof value !== 'string') {
    throw new AppError(400, 'Invalid template ID');
  }

  return value;
}

async function resolveTemplate(templateId, subject) {
  if (!templateId) {
    return { template: null, snapshot: null };
  }

  const template = await loadTemplateForJob(templateId, subject);
  return { template: template._id, snapshot: snapshotTemplate(template) };
}

async function loadEligibleContributor(contributorId, subject) {
  const user = await User.findById(contributorId);

  if (!user) {
    throw new AppError(400, 'Contributor not found');
  }

  if (user.role !== 'CONTRIBUTOR') {
    throw new AppError(400, 'Only contributor accounts can be assigned to a job');
  }

  if (user.isActive === false) {
    throw new AppError(400, 'Inactive contributors cannot be assigned to a job');
  }

  if (user.subject !== subject) {
    throw new AppError(400, "The contributor's subject does not match the job subject");
  }

  return user;
}

// ---------- Admin operations ----------

async function findJob(id) {
  assertValidId(id, 'Invalid job ID');

  const job = await Job.findById(id);
  if (!job) {
    throw new AppError(404, 'Job not found');
  }

  return job;
}

async function listJobs() {
  const jobs = await Job.find().sort({ createdAt: -1 }).populate(ADMIN_POPULATE);
  return jobs.map(toAdminJob);
}

async function getJob(id) {
  const job = await findJob(id);
  await job.populate(ADMIN_POPULATE);
  return toAdminJob(job);
}

function newlyAssigned(previousStatus, previousContributorId, nextStatus, nextContributorId) {
  const assignedNow = nextStatus === 'ASSIGNED' || nextStatus === 'IN_PROGRESS';
  if (!nextContributorId || !assignedNow) {
    return false;
  }

  const sameContributor = previousContributorId === nextContributorId;
  const assignedBefore = previousStatus === 'ASSIGNED'
    || previousStatus === 'IN_PROGRESS'
    || previousStatus === 'COMPLETED';
  return !(sameContributor && assignedBefore);
}

async function recordJobAssignment(actor, job) {
  const contributorName = job.contributor && job.contributor.name ? job.contributor.name : 'a contributor';
  await activityService.record({
    actorId: actor._id,
    action: 'JOB_ASSIGNED',
    entityType: 'Job',
    entityId: job._id,
    description: `${actor.name} assigned ${job.title} to ${contributorName}.`,
    metadata: {
      jobId: String(job._id),
      contributorId: String(job.contributor._id || job.contributor),
    },
  });
  await notifyJobAssigned(job.contributor._id || job.contributor, job);
}

async function createJob(body, admin) {
  const fields = parseJobFields(body);
  assertNotInPast(fields.deadline);

  const status =
    body?.status === undefined || body?.status === null || body?.status === ''
      ? 'DRAFT'
      : parseStatus(body.status);

  if (!CREATION_STATUSES.includes(status)) {
    throw new AppError(400, 'A new job can only be saved as Draft or Assigned');
  }

  const contributorId = parseContributorId(body?.contributor);
  if (contributorId) {
    await loadEligibleContributor(contributorId, fields.subject);
  }

  if (status === 'ASSIGNED' && !contributorId) {
    throw new AppError(400, 'A contributor is required to assign a job');
  }

  const selectedTemplate = await resolveTemplate(parseTemplateSelection(body?.template) || null, fields.subject);

  const job = await Job.create({
    ...fields,
    contributor: contributorId,
    template: selectedTemplate.template,
    templateSnapshot: selectedTemplate.snapshot,
    status,
    createdBy: admin._id,
  });

  await job.populate(ADMIN_POPULATE);
  await activityService.record({
    actorId: admin._id,
    action: 'JOB_CREATED',
    entityType: 'Job',
    entityId: job._id,
    description: `${admin.name} created job ${job.title}.`,
    metadata: { jobId: String(job._id) },
  });
  if (newlyAssigned(null, null, status, contributorId)) {
    await recordJobAssignment(admin, job);
  }
  return toAdminJob(job);
}

async function updateJob(id, body, actor) {
  const job = await findJob(id);
  const previousStatus = job.status;

  if (job.status === 'CANCELLED') {
    throw new AppError(409, 'Cancelled jobs cannot be edited');
  }

  if (job.status === 'COMPLETED') {
    throw new AppError(409, 'Completed jobs cannot be edited');
  }

  const fields = parseJobFields(body);
  if (fields.deadline.getTime() !== job.deadline.getTime()) {
    assertNotInPast(fields.deadline);
  }

  const currentContributorId = job.contributor ? String(job.contributor) : null;
  const nextContributorId =
    body?.contributor === undefined ? currentContributorId : parseContributorId(body.contributor);
  const contributorChanged = nextContributorId !== currentContributorId;

  if (contributorChanged && job.status === 'IN_PROGRESS') {
    throw new AppError(409, 'The contributor cannot be changed once work has started');
  }

  let nextStatus = job.status;
  if (body?.status !== undefined && body.status !== null && body.status !== '') {
    nextStatus = parseStatus(body.status);

    if (nextStatus === 'CANCELLED' && job.status !== 'CANCELLED') {
      throw new AppError(400, 'Use the cancel action to cancel a job');
    }

    if (nextStatus !== job.status && !STATUS_TRANSITIONS[job.status].includes(nextStatus)) {
      throw new AppError(400, `A job cannot change from ${job.status} to ${nextStatus}`);
    }
  }

  const statusChanged = nextStatus !== job.status;
  const subjectChanged = fields.subject !== job.subject;

  if (nextContributorId && (contributorChanged || subjectChanged || statusChanged)) {
    await loadEligibleContributor(nextContributorId, fields.subject);
  }

  if (ASSIGNED_STATUSES.includes(nextStatus) && !nextContributorId) {
    throw new AppError(400, 'A contributor is required for this job status');
  }

  const requestedTemplate = parseTemplateSelection(body?.template);
  const currentTemplateId = job.templateSnapshot?.templateId
    ? String(job.templateSnapshot.templateId)
    : null;
  const nextTemplateId = requestedTemplate === undefined ? currentTemplateId : requestedTemplate;
  const templateChanged = nextTemplateId !== currentTemplateId;

  if (templateChanged) {
    const hasSubmission = await Submission.exists({ job: job._id });
    if (hasSubmission) {
      throw new AppError(409, 'This job already has a submission, so its template cannot be changed');
    }
  } else if (nextTemplateId && subjectChanged && job.templateSnapshot?.subject !== fields.subject) {
    throw new AppError(400, 'The template subject does not match the job subject');
  }

  let templateUpdate = null;
  if (templateChanged) {
    templateUpdate = await resolveTemplate(nextTemplateId, fields.subject);
  }

  Object.assign(job, fields, {
    contributor: nextContributorId,
    status: nextStatus,
    ...(templateUpdate
      ? { template: templateUpdate.template, templateSnapshot: templateUpdate.snapshot }
      : {}),
  });
  await job.save();

  await job.populate(ADMIN_POPULATE);
  await activityService.record({
    actorId: actor._id,
    action: 'JOB_UPDATED',
    entityType: 'Job',
    entityId: job._id,
    description: `${actor.name} updated job ${job.title}.`,
    metadata: { jobId: String(job._id) },
  });
  if (newlyAssigned(previousStatus, currentContributorId, job.status, job.contributor ? String(job.contributor._id || job.contributor) : null)) {
    await recordJobAssignment(actor, job);
  }
  return toAdminJob(job);
}

async function cancelJob(id, actor) {
  const job = await findJob(id);

  if (job.status === 'CANCELLED') {
    throw new AppError(409, 'This job is already cancelled');
  }

  if (job.status === 'COMPLETED') {
    throw new AppError(409, 'Completed jobs cannot be cancelled');
  }

  job.status = 'CANCELLED';
  await job.save();

  await job.populate(ADMIN_POPULATE);
  await activityService.record({
    actorId: actor._id,
    action: 'JOB_CANCELLED',
    entityType: 'Job',
    entityId: job._id,
    description: `${actor.name} cancelled job ${job.title}.`,
    metadata: { jobId: String(job._id) },
  });
  return toAdminJob(job);
}

// ---------- Contributor operations ----------
// The contributor is always the authenticated user; IDs from the client are never used.

async function listJobsForContributor(user) {
  const jobs = await Job.find({
    contributor: user._id,
    status: { $in: CONTRIBUTOR_VISIBLE_STATUSES },
  }).sort({ deadline: 1 });

  const jobIds = jobs.map((j) => j._id);
  const submissions = await Submission.find({ job: { $in: jobIds } }).lean();
  const submissionMap = new Map(submissions.map((s) => [String(s.job), s]));

  return jobs.map((job) => toContributorJob(job, submissionMap.get(String(job._id))));
}

async function getJobForContributor(user, id) {
  assertValidId(id, 'Invalid job ID');

  const job = await Job.findOne({
    _id: id,
    contributor: user._id,
    status: { $in: CONTRIBUTOR_VISIBLE_STATUSES },
  });

  if (!job) {
    throw new AppError(404, 'Job not found');
  }

  const submission = await Submission.findOne({ job: job._id }).lean();
  return toContributorJob(job, submission);
}

module.exports = {
  listJobs,
  getJob,
  createJob,
  updateJob,
  cancelJob,
  listJobsForContributor,
  getJobForContributor,
};
