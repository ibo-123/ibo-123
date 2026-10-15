const Job = require('../models/Job');
const Submission = require('../models/Submission');
const AppError = require('../utils/AppError');
const { CONTRIBUTOR_VISIBLE_STATUSES } = require('../constants/jobs');
const { OPEN_JOB_STATUSES, EDITABLE_SUBMISSION_STATUSES, REVIEWABLE_SUBMISSION_STATUSES, REVIEW_DECISIONS } = require('../constants/templates');
const { SUBJECTS } = require('../constants/contributors');
const { saveFile, deleteFile, resolveKey, maxFiles, isAllowedFile } = require('./fileStorage');
const activityService = require('./activityService');
const { processResource } = require('./resourceProcessingService');
const topicService = require('./topicService');
const {
  notifyAdminsOfSubmission,
  notifyRevisionRequested,
  notifySubmissionApproved,
} = require('./notificationService');

const OBJECT_ID_PATTERN = /^[a-fA-F0-9]{24}$/;

function assertValidId(id, message) {
  if (typeof id !== 'string' || !OBJECT_ID_PATTERN.test(id)) {
    throw new AppError(400, message);
  }
}

function serializeFile(file) {
  return {
    id: file._id,
    originalName: file.originalName,
    mimeType: file.mimeType,
    size: file.size,
    order: file.order ?? 0,
    uploadedAt: file.uploadedAt,
  };
}

function serializeItems(items) {
  return [...items]
    .sort((left, right) => left.order - right.order)
    .map((item) => ({ order: item.order, values: item.values }));
}

function serializeSubmission(submission, { includeInternal, includeHistory }) {
  const job = submission.job;
  const contributor = submission.contributor;
  const snapshot = submission.templateSnapshot;
  const topicRes = submission.topicResource;

  const result = {
    id: submission._id,
    submissionType: submission.submissionType || 'TEMPLATE',
    job: job && job.title
      ? {
          id: job._id,
          title: job.title,
          subject: job.subject,
          topic: job.topic,
          quantity: job.quantity,
          difficulty: job.difficulty,
          deadline: job.deadline,
          status: job.status,
        }
      : job
        ? { id: job }
        : null,
    template: snapshot
      ? {
          id: snapshot.templateId,
          name: snapshot.name,
          version: snapshot.version,
          type: snapshot.type,
          subject: snapshot.subject,
          fields: snapshot.fields,
        }
      : null,
    topicResource: topicRes
      ? {
          subject: topicRes.subject,
          topic: topicRes.topic,
          resourceName: topicRes.resourceName,
          pageFrom: topicRes.pageFrom,
          pageTo: topicRes.pageTo,
          prerequisites: topicRes.prerequisites || [],
          inputType: topicRes.inputType,
          rawContent: topicRes.rawContent || '',
          extractedContent: topicRes.extractedContent || '',
          normalizedContent: topicRes.normalizedContent || '',
          processingStatus: topicRes.processingStatus || 'PENDING',
          processingError: topicRes.processingError || '',
        }
      : null,
    items: serializeItems(submission.items || []),
    files: (submission.files || []).map(serializeFile),
    notes: submission.notes || '',
    status: submission.status,
    currentVersion: submission.currentVersion || 0,
    approvedVersion: submission.approvedVersion ?? null,
    contentReadyAt: submission.contentReadyAt ?? null,
    submittedAt: submission.submittedAt,
    createdAt: submission.createdAt,
    updatedAt: submission.updatedAt,
  };

  if (includeHistory) {
    result.versions = [...(submission.versions || [])]
      .sort((left, right) => left.number - right.number)
      .map((version) => ({
        number: version.number,
        notes: version.notes,
        topicResource: version.topicResource || null,
        items: serializeItems(version.items || []),
        files: (version.files || []).map(serializeFile),
        submittedAt: version.submittedAt,
      }));
    result.reviews = [...(submission.reviews || [])]
      .sort((left, right) => new Date(left.createdAt) - new Date(right.createdAt))
      .map((review) => ({
        id: review._id,
        version: review.version,
        decision: review.decision,
        feedback: review.feedback,
        createdAt: review.createdAt,
        reviewer: review.reviewer && review.reviewer.name
          ? { id: review.reviewer._id, name: review.reviewer.name }
          : { id: review.reviewer },
      }));
  }

  if (contributor && contributor.name) {
    result.contributor = { id: contributor._id, name: contributor.name, email: contributor.email };
  } else if (includeInternal && contributor) {
    result.contributor = { id: contributor };
  } else {
    result.contributor = null;
  }

  return result;
}

const POPULATE = [
  { path: 'job', select: 'title subject topic quantity difficulty deadline status contributor' },
  { path: 'contributor', select: 'name email' },
  { path: 'reviews.reviewer', select: 'name' },
];

function isBlank(value) {
  return value === undefined || value === null || value === '';
}

function normalizeValue(field, raw, { strict }) {
  if (isBlank(raw)) {
    if (strict && field.required) {
      throw new AppError(400, `${field.label} is required`);
    }
    return field.type === 'number' ? null : '';
  }

  if (field.type === 'number') {
    if (typeof raw !== 'number' || !Number.isFinite(raw)) {
      throw new AppError(400, `${field.label} must be a number`);
    }
    return raw;
  }

  if (typeof raw !== 'string') {
    throw new AppError(400, `${field.label} must be text`);
  }

  const value = raw.trim();
  if (!value && strict && field.required) {
    throw new AppError(400, `${field.label} is required`);
  }

  if (field.type === 'select' && value && !field.options.includes(value)) {
    throw new AppError(400, `${field.label} has an invalid option`);
  }

  if (field.type === 'select' && strict && field.required && !field.options.includes(value)) {
    throw new AppError(400, `${field.label} is required`);
  }

  return value;
}

function parseItems(rawItems, snapshot, quantity, { strict }) {
  if (!Array.isArray(rawItems)) {
    throw new AppError(400, 'Submission items must be a list');
  }

  if (rawItems.length > quantity) {
    throw new AppError(400, `This job requires exactly ${quantity} items`);
  }

  if (strict && rawItems.length !== quantity) {
    throw new AppError(400, `This job requires exactly ${quantity} items`);
  }

  const known = new Set(snapshot.fields.map((field) => field.name));

  return rawItems.map((item, index) => {
    const values = item?.values;
    if (!values || typeof values !== 'object' || Array.isArray(values)) {
      throw new AppError(400, `Item ${index + 1} is missing its fields`);
    }

    const unknown = Object.keys(values).filter((key) => !known.has(key));
    if (unknown.length > 0) {
      throw new AppError(400, `Item ${index + 1} has an unknown field`);
    }

    const stored = {};
    for (const field of snapshot.fields) {
      try {
        stored[field.name] = normalizeValue(field, values[field.name], { strict });
      } catch (error) {
        if (error instanceof AppError) {
          throw new AppError(error.statusCode, `Item ${index + 1}: ${error.message}`);
        }
        throw error;
      }
    }

    return { order: index + 1, values: stored };
  });
}

function blankItems(snapshot, quantity) {
  return Array.from({ length: quantity }, (_, index) => ({
    order: index + 1,
    values: Object.fromEntries(
      snapshot.fields.map((field) => [field.name, field.type === 'number' ? null : '']),
    ),
  }));
}

function deadlinePassed(job) {
  return job.deadline.getTime() < Date.now();
}

async function findOwnedJob(user, jobId) {
  assertValidId(jobId, 'Invalid job ID');

  const job = await Job.findOne({
    _id: jobId,
    contributor: user._id,
    status: { $in: CONTRIBUTOR_VISIBLE_STATUSES },
  });

  if (!job) {
    throw new AppError(404, 'Job not found');
  }

  return job;
}

function assertOpenForWork(job) {
  if (job.status === 'CANCELLED') {
    throw new AppError(409, 'Cancelled jobs cannot receive submissions');
  }

  if (!OPEN_JOB_STATUSES.includes(job.status)) {
    throw new AppError(409, 'This job is no longer open for submissions');
  }

  if (!job.templateSnapshot || !job.templateSnapshot.fields?.length) {
    throw new AppError(409, 'This job does not have a submission template yet');
  }
}

async function getSubmissionForJob(user, jobId) {
  await findOwnedJob(user, jobId);
  const submission = await Submission.findOne({ job: jobId, contributor: user._id }).populate(POPULATE);
  return submission ? serializeSubmission(submission, { includeInternal: false, includeHistory: true }) : null;
}

async function createSubmission(user, jobId, body) {
  const job = await findOwnedJob(user, jobId);
  assertOpenForWork(job);

  const existing = await Submission.findOne({ job: job._id });
  if (existing) {
    throw new AppError(409, 'A submission already exists for this job');
  }

  if (body?.contributor !== undefined || body?.job !== undefined || body?.template !== undefined) {
    throw new AppError(400, 'Submission ownership cannot be changed');
  }

  const notes = typeof body?.notes === 'string' ? body.notes.trim() : '';
  const items = body?.items === undefined
    ? blankItems(job.templateSnapshot, job.quantity)
    : parseItems(body.items, job.templateSnapshot, job.quantity, { strict: false });

  if (body?.status !== undefined && body.status !== 'DRAFT') {
    throw new AppError(400, 'Submission status cannot be changed directly');
  }

  const submission = await Submission.create({
    job: job._id,
    contributor: user._id,
    template: job.templateSnapshot.templateId,
    templateSnapshot: job.templateSnapshot,
    items,
    notes,
    status: 'DRAFT',
  });

  await submission.populate(POPULATE);
  await activityService.record({
    actorId: user._id,
    action: 'SUBMISSION_CREATED',
    entityType: 'Submission',
    entityId: submission._id,
    description: `${user.name} created a submission for ${job.title}.`,
    metadata: { jobId: String(job._id), submissionId: String(submission._id), contributorId: String(user._id) },
  });
  return serializeSubmission(submission, { includeInternal: false, includeHistory: true });
}

async function findContributorSubmission(user, id) {
  assertValidId(id, 'Invalid submission ID');
  const submission = await Submission.findById(id);
  if (!submission) {
    throw new AppError(404, 'Submission not found');
  }
  if (String(submission.contributor) !== String(user._id)) {
    throw new AppError(403, 'You do not have access to this submission');
  }
  return submission;
}

async function getForContributor(user, id) {
  const submission = await findContributorSubmission(user, id);
  await submission.populate(POPULATE);
  return serializeSubmission(submission, { includeInternal: false, includeHistory: true });
}

function assertEditable(submission) {
  if (!EDITABLE_SUBMISSION_STATUSES.includes(submission.status)) {
    throw new AppError(409, 'Only a draft or a requested revision can be edited');
  }
}

function snapshotVersion(submission, number, submittedAt) {
  return {
    number,
    items: (submission.items || []).map((item) => ({
      order: item.order,
      values: item.values && typeof item.values === 'object' ? { ...item.values } : {},
    })),
    topicResource: submission.topicResource
      ? {
          subject: submission.topicResource.subject,
          topic: submission.topicResource.topic,
          resourceName: submission.topicResource.resourceName,
          pageFrom: submission.topicResource.pageFrom,
          pageTo: submission.topicResource.pageTo,
          prerequisites: [...(submission.topicResource.prerequisites || [])],
          inputType: submission.topicResource.inputType,
          rawContent: submission.topicResource.rawContent || '',
          extractedContent: submission.topicResource.extractedContent || '',
          normalizedContent: submission.topicResource.normalizedContent || '',
          processingStatus: submission.topicResource.processingStatus,
          processingError: submission.topicResource.processingError,
        }
      : null,
    notes: submission.notes || '',
    files: (submission.files || []).map((file) => ({
      _id: file._id,
      originalName: file.originalName,
      storageKey: file.storageKey,
      mimeType: file.mimeType,
      size: file.size,
      order: file.order ?? 0,
      uploadedAt: file.uploadedAt,
    })),
    submittedAt,
  };
}

function recordSubmittedVersion(submission, submittedAt) {
  const number = (submission.currentVersion || 0) + 1;
  submission.versions.push(snapshotVersion(submission, number, submittedAt));
  submission.currentVersion = number;
  submission.submittedAt = submittedAt;
}

async function markJobInProgress(job) {
  if (job && job.status === 'ASSIGNED') {
    job.status = 'IN_PROGRESS';
    await job.save();
  }
}

async function updateSubmission(user, id, body) {
  const submission = await findContributorSubmission(user, id);
  assertEditable(submission);

  if (body?.status !== undefined && body.status !== submission.status) {
    throw new AppError(400, 'Submission status cannot be changed directly');
  }

  if (body?.contributor !== undefined || body?.job !== undefined || body?.template !== undefined) {
    throw new AppError(400, 'Submission ownership cannot be changed');
  }

  const job = submission.job ? await Job.findById(submission.job) : null;
  if (submission.job && (!job || String(job.contributor) !== String(user._id))) {
    throw new AppError(404, 'Job not found');
  }
  if (job && job.status === 'CANCELLED') {
    throw new AppError(409, 'Cancelled jobs cannot receive submissions');
  }

  if (body?.notes !== undefined) {
    if (typeof body.notes !== 'string') {
      throw new AppError(400, 'Notes must be text');
    }
    submission.notes = body.notes.trim();
  }

  if (body?.items !== undefined && submission.templateSnapshot && job) {
    submission.items = parseItems(body.items, submission.templateSnapshot, job.quantity, {
      strict: false,
    });
  }

  await submission.save();
  await submission.populate(POPULATE);
  return serializeSubmission(submission, { includeInternal: false, includeHistory: true });
}

async function submitSubmission(user, id) {
  const submission = await findContributorSubmission(user, id);
  if (submission.status === 'REVISION_REQUIRED') {
    throw new AppError(400, 'Use resubmit after you finish the requested changes');
  }
  if (submission.status !== 'DRAFT') {
    throw new AppError(409, 'Only draft submissions can be submitted');
  }

  const job = submission.job ? await Job.findById(submission.job) : null;
  if (submission.job && (!job || String(job.contributor) !== String(user._id))) {
    throw new AppError(404, 'Job not found');
  }

  if (job) {
    assertOpenForWork(job);
    if (deadlinePassed(job)) {
      throw new AppError(409, 'The deadline has passed, so this submission cannot be sent');
    }
    if (submission.templateSnapshot) {
      submission.items = parseItems(submission.items, submission.templateSnapshot, job.quantity, {
        strict: true,
      });
    }
  }

  const submittedAt = new Date();
  recordSubmittedVersion(submission, submittedAt);
  submission.status = 'SUBMITTED';
  await submission.save();
  if (job) {
    await markJobInProgress(job);
  }
  await activityService.record({
    actorId: user._id,
    action: 'SUBMISSION_SUBMITTED',
    entityType: 'Submission',
    entityId: submission._id,
    description: `${user.name} submitted work for ${job ? job.title : (submission.topicResource?.resourceName || 'Topic Resource')}.`,
    metadata: {
      jobId: job ? String(job._id) : null,
      submissionId: String(submission._id),
      contributorId: String(user._id),
    },
  });
  await notifyAdminsOfSubmission(
    job || { title: submission.topicResource?.resourceName || 'Topic Resource' },
    submission._id,
    user.name,
    { resubmitted: false },
  );
  await submission.populate(POPULATE);
  return serializeSubmission(submission, { includeInternal: false, includeHistory: true });
}

async function addFiles(user, id, files) {
  const submission = await findContributorSubmission(user, id);
  assertEditable(submission);

  const job = submission.job ? await Job.findById(submission.job) : null;
  if (job && job.status === 'CANCELLED') {
    throw new AppError(409, 'Cancelled jobs cannot receive submissions');
  }

  if (!Array.isArray(files) || files.length === 0) {
    throw new AppError(400, 'Choose at least one file');
  }

  if (submission.files.length + files.length > maxFiles()) {
    throw new AppError(400, `A submission can have at most ${maxFiles()} files`);
  }

  const stored = [];
  try {
    for (const file of files) {
      if (!isAllowedFile(file.mimetype, file.originalname)) {
        throw new AppError(400, 'This file type is not allowed');
      }
      const storageKey = await saveFile(file.buffer, {
        mimeType: file.mimetype,
        originalName: file.originalname,
      });
      stored.push(storageKey);
      submission.files.push({
        originalName: file.originalname.replace(/[/\\]/g, '_').slice(0, 200),
        storageKey,
        mimeType: file.mimetype,
        size: file.size,
        uploadedAt: new Date(),
      });
    }
  } catch (error) {
    await Promise.all(stored.map((key) => deleteFile(key)));
    throw error;
  }

  await submission.save();
  await submission.populate(POPULATE);
  return serializeSubmission(submission, { includeInternal: false, includeHistory: true });
}

async function removeFile(user, id, fileId) {
  assertValidId(fileId, 'Invalid file ID');
  const submission = await findContributorSubmission(user, id);
  assertEditable(submission);

  const file = submission.files.id(fileId);
  if (!file) {
    throw new AppError(404, 'File not found');
  }

  const storageKey = file.storageKey;
  file.deleteOne();
  await submission.save();
  const keptInHistory = (submission.versions || []).some((version) =>
    version.files.some((stored) => stored.storageKey === storageKey),
  );
  if (!keptInHistory) {
    await deleteFile(storageKey);
  }
  await submission.populate(POPULATE);
  return serializeSubmission(submission, { includeInternal: false, includeHistory: true });
}

async function fileForDownload(user, id, fileId, { admin }) {
  assertValidId(id, 'Invalid submission ID');
  assertValidId(fileId, 'Invalid file ID');

  const submission = await Submission.findById(id);
  if (!submission) {
    throw new AppError(404, 'Submission not found');
  }

  if (!admin && String(submission.contributor) !== String(user._id)) {
    throw new AppError(403, 'You do not have access to this submission');
  }

  const historical = (submission.versions || []).flatMap((version) => [...version.files]);
  const file = submission.files.id(fileId) || historical.find((stored) => String(stored._id) === fileId);
  if (!file) {
    throw new AppError(404, 'File not found');
  }

  const absolutePath = resolveKey(file.storageKey);
  if (!absolutePath) {
    throw new AppError(404, 'File not found');
  }

  return { file, absolutePath };
}

async function listForContributor(user) {
  const submissions = await Submission.find({ contributor: user._id })
    .sort({ updatedAt: -1 })
    .populate(POPULATE);
  return submissions.map((submission) => serializeSubmission(submission, { includeInternal: false, includeHistory: false }));
}

async function listForAdmin() {
  const submissions = await Submission.find().sort({ updatedAt: -1 }).populate(POPULATE);
  return submissions.map((submission) => serializeSubmission(submission, { includeInternal: true, includeHistory: false }));
}

async function getForAdmin(id) {
  assertValidId(id, 'Invalid submission ID');
  const submission = await Submission.findById(id).populate(POPULATE);
  if (!submission) {
    throw new AppError(404, 'Submission not found');
  }
  return serializeSubmission(submission, { includeInternal: true, includeHistory: true });
}

function ensureSubmittedVersion(submission) {
  if (submission.versions?.length) {
    return;
  }
  const submittedAt = submission.submittedAt || new Date();
  submission.versions.push(snapshotVersion(submission, 1, submittedAt));
  submission.currentVersion = 1;
}

async function startReview(admin, id) {
  assertValidId(id, 'Invalid submission ID');
  const submission = await Submission.findById(id);
  if (!submission) {
    throw new AppError(404, 'Submission not found');
  }
  if (submission.status === 'UNDER_REVIEW') {
    await submission.populate(POPULATE);
    return serializeSubmission(submission, { includeInternal: true, includeHistory: true });
  }
  if (submission.status !== 'SUBMITTED') {
    throw new AppError(409, 'Only a submitted submission can be moved into review');
  }

  ensureSubmittedVersion(submission);
  submission.status = 'UNDER_REVIEW';
  await submission.save();
  await submission.populate(POPULATE);
  return serializeSubmission(submission, { includeInternal: true, includeHistory: true });
}

async function reviewSubmission(admin, id, body) {
  assertValidId(id, 'Invalid submission ID');
  const decision = typeof body?.decision === 'string' ? body.decision.trim() : '';
  if (!REVIEW_DECISIONS.includes(decision)) {
    throw new AppError(400, 'Choose approve, request revision, or reject');
  }

  const feedback = typeof body?.feedback === 'string' ? body.feedback.trim() : '';
  if (decision !== 'APPROVED' && !feedback) {
    throw new AppError(400, 'Feedback is required when you request a revision or reject the work');
  }
  if (body?.feedback !== undefined && typeof body.feedback !== 'string') {
    throw new AppError(400, 'Feedback must be text');
  }

  const submission = await Submission.findById(id);
  if (!submission) {
    throw new AppError(404, 'Submission not found');
  }
  if (!REVIEWABLE_SUBMISSION_STATUSES.includes(submission.status)) {
    throw new AppError(409, 'This submission is not waiting for a review');
  }

  ensureSubmittedVersion(submission);
  submission.reviews.push({
    version: submission.currentVersion,
    reviewer: admin._id,
    decision,
    feedback,
    createdAt: new Date(),
  });
  submission.status = decision;
  if (decision === 'APPROVED') {
    submission.approvedVersion = submission.currentVersion;
  }
  await submission.save();

  const job = submission.job ? await Job.findById(submission.job) : null;
  const resourceTitle = submission.topicResource?.resourceName || job?.title || 'work';

  if (decision === 'REVISION_REQUIRED') {
    await activityService.record({
      actorId: admin._id,
      action: 'REVISION_REQUESTED',
      entityType: 'Submission',
      entityId: submission._id,
      description: `${admin.name} requested a revision for ${resourceTitle}.`,
      metadata: {
        jobId: job ? String(job._id) : null,
        submissionId: String(submission._id),
        contributorId: String(submission.contributor),
        feedback,
      },
    });
    await notifyRevisionRequested(
      submission.contributor,
      job || { title: resourceTitle, _id: null },
      submission._id,
      feedback,
    );
  }
  if (decision === 'APPROVED') {
    await activityService.record({
      actorId: admin._id,
      action: 'SUBMISSION_APPROVED',
      entityType: 'Submission',
      entityId: submission._id,
      description: `${admin.name} approved the submission for ${resourceTitle}.`,
      metadata: {
        jobId: job ? String(job._id) : null,
        submissionId: String(submission._id),
        contributorId: String(submission.contributor),
      },
    });
    await notifySubmissionApproved(
      submission.contributor,
      job || { title: resourceTitle, _id: null },
      submission._id,
    );
  }

  await submission.populate(POPULATE);
  return serializeSubmission(submission, { includeInternal: true, includeHistory: true });
}

async function resubmitSubmission(user, id) {
  const submission = await findContributorSubmission(user, id);
  if (submission.status !== 'REVISION_REQUIRED') {
    throw new AppError(409, 'Only a submission that needs revision can be resubmitted');
  }

  if (submission.submissionType === 'TOPIC_RESOURCE') {
    return resubmitTopicResource(user, id);
  }

  const job = submission.job ? await Job.findById(submission.job) : null;
  if (submission.job && (!job || String(job.contributor) !== String(user._id))) {
    throw new AppError(404, 'Job not found');
  }
  if (job && job.status === 'CANCELLED') {
    throw new AppError(409, 'Cancelled jobs cannot receive submissions');
  }

  if (job && submission.templateSnapshot) {
    submission.items = parseItems(submission.items, submission.templateSnapshot, job.quantity, {
      strict: true,
    });
  }
  recordSubmittedVersion(submission, new Date());
  submission.status = 'SUBMITTED';
  await submission.save();
  await activityService.record({
    actorId: user._id,
    action: 'SUBMISSION_RESUBMITTED',
    entityType: 'Submission',
    entityId: submission._id,
    description: `${user.name} resubmitted work for ${job ? job.title : (submission.topicResource?.resourceName || 'Topic Resource')}.`,
    metadata: {
      jobId: job ? String(job._id) : null,
      submissionId: String(submission._id),
      contributorId: String(user._id),
    },
  });
  await notifyAdminsOfSubmission(
    job || { title: submission.topicResource?.resourceName || 'Topic Resource' },
    submission._id,
    user.name,
    { resubmitted: true },
  );
  await submission.populate(POPULATE);
  return serializeSubmission(submission, { includeInternal: false, includeHistory: true });
}

async function markContentReady(id) {
  assertValidId(id, 'Invalid submission ID');
  const submission = await Submission.findById(id);
  if (!submission) {
    throw new AppError(404, 'Submission not found');
  }
  if (submission.status === 'CONTENT_READY') {
    throw new AppError(409, 'This submission is already content ready');
  }
  if (submission.status !== 'APPROVED') {
    throw new AppError(409, 'Only an approved submission can be marked content ready');
  }
  if (!submission.approvedVersion) {
    throw new AppError(409, 'This submission has no approved version');
  }

  submission.status = 'CONTENT_READY';
  submission.contentReadyAt = new Date();
  await submission.save();

  const job = await Job.findById(submission.job);
  if (job && (job.status === 'ASSIGNED' || job.status === 'IN_PROGRESS')) {
    job.status = 'COMPLETED';
    await job.save();
  }

  await submission.populate(POPULATE);
  return serializeSubmission(submission, { includeInternal: true, includeHistory: true });
}

function validateTopicResourceInput(body, hasFiles) {
  const subject = String(body.subject || '').toUpperCase().trim();
  if (!SUBJECTS.includes(subject)) {
    throw new AppError(400, 'Valid subject is required');
  }

  const topic = String(body.topic || '').trim();
  if (!topic) {
    throw new AppError(400, 'Topic is required');
  }

  const resourceName = String(body.resourceName || '').trim();
  if (!resourceName) {
    throw new AppError(400, 'Resource Name is required');
  }

  const pageFrom = Number(body.pageFrom);
  const pageTo = Number(body.pageTo);

  if (!Number.isInteger(pageFrom) || pageFrom < 1) {
    throw new AppError(400, 'Page From must be a whole number >= 1');
  }

  if (!Number.isInteger(pageTo) || pageTo < pageFrom) {
    throw new AppError(400, 'Page To must be a whole number >= Page From');
  }

  const rawContent = typeof body.rawContent === 'string' ? body.rawContent.trim() : '';

  if (!rawContent && !hasFiles) {
    throw new AppError(400, 'At least one resource input (Text content or Uploaded file) is required');
  }

  let prerequisites = [];
  if (Array.isArray(body.prerequisites)) {
    prerequisites = [...new Set(body.prerequisites.map((p) => String(p).trim()).filter(Boolean))];
  } else if (typeof body.prerequisites === 'string') {
    try {
      const parsed = JSON.parse(body.prerequisites);
      if (Array.isArray(parsed)) {
        prerequisites = [...new Set(parsed.map((p) => String(p).trim()).filter(Boolean))];
      }
    } catch {
      prerequisites = body.prerequisites.split(',').map((p) => p.trim()).filter(Boolean);
    }
  }

  return {
    subject,
    topic,
    resourceName,
    pageFrom,
    pageTo,
    prerequisites,
    rawContent,
  };
}

async function createTopicResourceSubmission(user, body, files = []) {
  const {
    subject,
    topic,
    resourceName,
    pageFrom,
    pageTo,
    prerequisites,
    rawContent,
  } = validateTopicResourceInput(body, files.length > 0);

  let job = null;
  if (body?.jobId) {
    job = await findOwnedJob(user, body.jobId);
    assertOpenForWork(job);
    const existing = await Submission.findOne({ job: job._id });
    if (existing) {
      throw new AppError(409, 'A submission already exists for this job');
    }
  }

  const storedFiles = [];
  try {
    for (let index = 0; index < files.length; index += 1) {
      const file = files[index];
      if (!isAllowedFile(file.mimetype, file.originalname)) {
        throw new AppError(400, `File type for ${file.originalname} is not allowed`);
      }
      const storageKey = await saveFile(file.buffer, {
        mimeType: file.mimetype,
        originalName: file.originalname,
      });
      storedFiles.push({
        originalName: file.originalname.replace(/[/\\]/g, '_').slice(0, 200),
        storageKey,
        mimeType: file.mimetype,
        size: file.size,
        order: index,
        uploadedAt: new Date(),
      });
    }
  } catch (err) {
    await Promise.all(storedFiles.map((f) => deleteFile(f.storageKey)));
    throw err;
  }

  const processed = await processResource({
    files: storedFiles,
    rawContent,
    metadata: {
      resourceName,
      subject,
      topic,
      pageFrom,
      pageTo,
      prerequisites,
    },
  });

  await topicService.upsertTopicPrerequisites(subject, topic, prerequisites).catch(() => {});

  const submittedAt = new Date();
  const submission = new Submission({
    submissionType: 'TOPIC_RESOURCE',
    job: job ? job._id : null,
    contributor: user._id,
    template: null,
    templateSnapshot: null,
    files: storedFiles,
    notes: typeof body.notes === 'string' ? body.notes.trim() : '',
    status: 'SUBMITTED',
    submittedAt,
    currentVersion: 1,
    topicResource: {
      subject,
      topic,
      resourceName,
      pageFrom,
      pageTo,
      prerequisites,
      inputType: processed.inputType,
      rawContent,
      extractedContent: processed.extractedContent,
      normalizedContent: processed.normalizedContent,
      processingStatus: processed.processingStatus,
      processingError: processed.processingError,
    },
    versions: [
      {
        number: 1,
        items: [],
        notes: typeof body.notes === 'string' ? body.notes.trim() : '',
        topicResource: {
          subject,
          topic,
          resourceName,
          pageFrom,
          pageTo,
          prerequisites,
          inputType: processed.inputType,
          rawContent,
          extractedContent: processed.extractedContent,
          normalizedContent: processed.normalizedContent,
          processingStatus: processed.processingStatus,
          processingError: processed.processingError,
        },
        files: storedFiles,
        submittedAt,
      },
    ],
  });

  await submission.save();
  if (job) {
    await markJobInProgress(job);
  }

  await activityService.record({
    actorId: user._id,
    action: 'SUBMISSION_SUBMITTED',
    entityType: 'Submission',
    entityId: submission._id,
    description: `${user.name} submitted Topic Resource "${resourceName}".`,
    metadata: {
      jobId: job ? String(job._id) : null,
      submissionId: String(submission._id),
      contributorId: String(user._id),
    },
  });

  await notifyAdminsOfSubmission(
    job || { title: `Topic Resource: ${resourceName}` },
    submission._id,
    user.name,
    { resubmitted: false },
  );

  await submission.populate(POPULATE);
  return serializeSubmission(submission, { includeInternal: false, includeHistory: true });
}

async function updateTopicResourceSubmission(user, id, body, newFiles = []) {
  const submission = await findContributorSubmission(user, id);
  assertEditable(submission);

  const existingFiles = submission.files || [];
  const hasFiles = existingFiles.length > 0 || (newFiles && newFiles.length > 0);

  const {
    subject,
    topic,
    resourceName,
    pageFrom,
    pageTo,
    prerequisites,
    rawContent,
  } = validateTopicResourceInput(body, hasFiles);

  const storedNewFiles = [];
  try {
    for (let i = 0; i < newFiles.length; i += 1) {
      const file = newFiles[i];
      if (!isAllowedFile(file.mimetype, file.originalname)) {
        throw new AppError(400, `File type for ${file.originalname} is not allowed`);
      }
      const storageKey = await saveFile(file.buffer, {
        mimeType: file.mimetype,
        originalName: file.originalname,
      });
      storedNewFiles.push({
        originalName: file.originalname.replace(/[/\\]/g, '_').slice(0, 200),
        storageKey,
        mimeType: file.mimetype,
        size: file.size,
        order: existingFiles.length + i,
        uploadedAt: new Date(),
      });
    }
  } catch (err) {
    await Promise.all(storedNewFiles.map((f) => deleteFile(f.storageKey)));
    throw err;
  }

  const allFiles = [...existingFiles, ...storedNewFiles];
  submission.files = allFiles;

  const processed = await processResource({
    files: allFiles,
    rawContent,
    metadata: {
      resourceName,
      subject,
      topic,
      pageFrom,
      pageTo,
      prerequisites,
    },
  });

  await topicService.upsertTopicPrerequisites(subject, topic, prerequisites).catch(() => {});

  submission.topicResource = {
    subject,
    topic,
    resourceName,
    pageFrom,
    pageTo,
    prerequisites,
    inputType: processed.inputType,
    rawContent,
    extractedContent: processed.extractedContent,
    normalizedContent: processed.normalizedContent,
    processingStatus: processed.processingStatus,
    processingError: processed.processingError,
  };

  if (body?.notes !== undefined) {
    submission.notes = typeof body.notes === 'string' ? body.notes.trim() : '';
  }

  if (body.submitNow === true || body.submitNow === 'true') {
    const submittedAt = new Date();
    const nextVersion = (submission.currentVersion || 0) + 1;
    submission.currentVersion = nextVersion;
    submission.submittedAt = submittedAt;
    submission.status = 'SUBMITTED';
    submission.versions.push({
      number: nextVersion,
      items: [],
      notes: submission.notes,
      topicResource: { ...submission.topicResource.toObject() },
      files: allFiles,
      submittedAt,
    });

    const job = submission.job ? await Job.findById(submission.job) : null;
    await activityService.record({
      actorId: user._id,
      action: 'SUBMISSION_RESUBMITTED',
      entityType: 'Submission',
      entityId: submission._id,
      description: `${user.name} resubmitted Topic Resource "${resourceName}".`,
      metadata: {
        jobId: job ? String(job._id) : null,
        submissionId: String(submission._id),
        contributorId: String(user._id),
      },
    });

    await notifyAdminsOfSubmission(
      job || { title: `Topic Resource: ${resourceName}` },
      submission._id,
      user.name,
      { resubmitted: true },
    );
  }

  await submission.save();
  await submission.populate(POPULATE);
  return serializeSubmission(submission, { includeInternal: false, includeHistory: true });
}

async function resubmitTopicResource(user, id) {
  const submission = await findContributorSubmission(user, id);
  if (submission.status !== 'REVISION_REQUIRED') {
    throw new AppError(409, 'Only a submission that needs revision can be resubmitted');
  }

  const job = submission.job ? await Job.findById(submission.job) : null;
  const resourceName = submission.topicResource?.resourceName || 'Topic Resource';

  const submittedAt = new Date();
  const nextVersion = (submission.currentVersion || 0) + 1;
  submission.currentVersion = nextVersion;
  submission.submittedAt = submittedAt;
  submission.status = 'SUBMITTED';
  submission.versions.push({
    number: nextVersion,
    items: [],
    notes: submission.notes || '',
    topicResource: submission.topicResource ? { ...submission.topicResource.toObject() } : null,
    files: submission.files || [],
    submittedAt,
  });

  await submission.save();

  await activityService.record({
    actorId: user._id,
    action: 'SUBMISSION_RESUBMITTED',
    entityType: 'Submission',
    entityId: submission._id,
    description: `${user.name} resubmitted Topic Resource "${resourceName}".`,
    metadata: {
      jobId: job ? String(job._id) : null,
      submissionId: String(submission._id),
      contributorId: String(user._id),
    },
  });

  await notifyAdminsOfSubmission(
    job || { title: `Topic Resource: ${resourceName}` },
    submission._id,
    user.name,
    { resubmitted: true },
  );

  await submission.populate(POPULATE);
  return serializeSubmission(submission, { includeInternal: false, includeHistory: true });
}

async function reorderSubmissionFiles(user, id, fileIds = []) {
  const submission = await findContributorSubmission(user, id);
  assertEditable(submission);

  if (!Array.isArray(fileIds)) {
    throw new AppError(400, 'File IDs must be an array');
  }

  const fileMap = new Map((submission.files || []).map((f) => [String(f._id), f]));
  const reordered = [];

  for (let i = 0; i < fileIds.length; i += 1) {
    const file = fileMap.get(String(fileIds[i]));
    if (file) {
      file.order = i;
      reordered.push(file);
      fileMap.delete(String(file._id));
    }
  }

  for (const remaining of fileMap.values()) {
    remaining.order = reordered.length;
    reordered.push(remaining);
  }

  submission.files = reordered;
  await submission.save();

  if (submission.submissionType === 'TOPIC_RESOURCE' && submission.topicResource?.inputType === 'IMAGE') {
    const processed = await processResource({
      files: submission.files,
      rawContent: submission.topicResource.rawContent,
      metadata: {
        resourceName: submission.topicResource.resourceName,
        subject: submission.topicResource.subject,
        topic: submission.topicResource.topic,
        pageFrom: submission.topicResource.pageFrom,
        pageTo: submission.topicResource.pageTo,
        prerequisites: submission.topicResource.prerequisites,
      },
    });
    submission.topicResource.extractedContent = processed.extractedContent;
    submission.topicResource.normalizedContent = processed.normalizedContent;
    submission.topicResource.processingStatus = processed.processingStatus;
    submission.topicResource.processingError = processed.processingError;
    await submission.save();
  }

  await submission.populate(POPULATE);
  return serializeSubmission(submission, { includeInternal: false, includeHistory: true });
}

function exportPayload(submission) {
  const version = (submission.versions || []).find((item) => item.number === submission.approvedVersion);
  if (!version) {
    throw new AppError(409, 'The approved version is missing, so this submission cannot be exported');
  }

  const job = submission.job;
  const snapshot = submission.templateSnapshot;
  const topicRes = version.topicResource || submission.topicResource;

  if (submission.submissionType === 'TOPIC_RESOURCE' || topicRes) {
    return {
      exportedAt: new Date().toISOString(),
      purpose: 'ethio-exam-platform-handoff',
      submissionId: String(submission._id),
      submissionType: 'TOPIC_RESOURCE',
      version: version.number,
      status: 'CONTENT_READY',
      subject: topicRes?.subject || job?.subject || '',
      topic: topicRes?.topic || job?.topic || '',
      topicResource: {
        resourceName: topicRes?.resourceName || '',
        pageFrom: topicRes?.pageFrom,
        pageTo: topicRes?.pageTo,
        prerequisites: topicRes?.prerequisites || [],
        inputType: topicRes?.inputType || 'TEXT',
        normalizedContent: topicRes?.normalizedContent || '',
        extractedContent: topicRes?.extractedContent || '',
        processingStatus: topicRes?.processingStatus || 'PROCESSED',
      },
      contributor: submission.contributor && submission.contributor.name
        ? { id: String(submission.contributor._id), name: submission.contributor.name }
        : { id: String(submission.contributor) },
      notes: version.notes || '',
      files: (version.files || []).map((file) => ({
        id: String(file._id),
        name: file.originalName,
        mimeType: file.mimeType,
        size: file.size,
      })),
    };
  }

  return {
    exportedAt: new Date().toISOString(),
    purpose: 'ethio-exam-platform-handoff',
    submissionId: String(submission._id),
    version: version.number,
    status: 'CONTENT_READY',
    subject: job?.subject || snapshot?.subject,
    topic: job?.topic || '',
    template: snapshot ? {
      name: snapshot.name,
      type: snapshot.type,
      version: snapshot.version,
      fields: snapshot.fields.map((field) => ({
        name: field.name,
        label: field.label,
        type: field.type,
        required: field.required,
        order: field.order,
        options: field.options || [],
      })),
    } : null,
    job: job && job.title
      ? {
          id: String(job._id),
          title: job.title,
          difficulty: job.difficulty,
          quantity: job.quantity,
        }
      : { id: String(job) },
    contributor: submission.contributor && submission.contributor.name
      ? { id: String(submission.contributor._id), name: submission.contributor.name }
      : { id: String(submission.contributor) },
    notes: version.notes,
    items: serializeItems(version.items || []),
    files: (version.files || []).map((file) => ({
      id: String(file._id),
      name: file.originalName,
      mimeType: file.mimeType,
      size: file.size,
    })),
  };
}

async function exportSubmission(id) {
  assertValidId(id, 'Invalid submission ID');
  const submission = await Submission.findById(id).populate(POPULATE);
  if (!submission) {
    throw new AppError(404, 'Submission not found');
  }
  if (submission.status !== 'CONTENT_READY') {
    throw new AppError(409, 'Only content-ready submissions can be exported');
  }
  return exportPayload(submission);
}

async function listContentReady() {
  const submissions = await Submission.find({ status: 'CONTENT_READY' })
    .sort({ contentReadyAt: -1 })
    .populate(POPULATE);
  return submissions.map((submission) => serializeSubmission(submission, { includeInternal: true, includeHistory: false }));
}

async function exportContentReady() {
  const submissions = await Submission.find({ status: 'CONTENT_READY' })
    .sort({ contentReadyAt: -1 })
    .populate(POPULATE);

  return {
    exportedAt: new Date().toISOString(),
    purpose: 'ethio-exam-platform-handoff',
    submissions: submissions.map(exportPayload),
  };
}

module.exports = {
  getSubmissionForJob,
  createSubmission,
  updateSubmission,
  submitSubmission,
  createTopicResourceSubmission,
  updateTopicResourceSubmission,
  resubmitTopicResource,
  reorderSubmissionFiles,
  validateTopicResourceInput,
  addFiles,
  removeFile,
  fileForDownload,
  listForContributor,
  listForAdmin,
  getForAdmin,
  getForContributor,
  startReview,
  reviewSubmission,
  resubmitSubmission,
  markContentReady,
  exportSubmission,
  listContentReady,
  exportContentReady,
};
