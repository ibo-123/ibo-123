const User = require('../models/User');
const activityService = require('./activityService');
const AppError = require('../utils/AppError');
const {
  CONTRIBUTOR_ROLES,
  SUBJECTS,
  VERIFICATION_STATUSES,
} = require('../constants/contributors');

const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;

function assertValidId(id) {
  if (typeof id !== 'string' || !/^[a-fA-F0-9]{24}$/.test(id)) {
    throw new AppError(400, 'Invalid contributor ID');
  }
}

async function findContributor(id) {
  assertValidId(id);

  const user = await User.findOne({ _id: id, role: 'CONTRIBUTOR' });
  if (!user) {
    throw new AppError(404, 'Contributor not found');
  }

  return user;
}

function parseName(value) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new AppError(400, 'Name is required');
  }

  return value.trim();
}

function parseEmail(value) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new AppError(400, 'Email is required');
  }

  const email = value.trim().toLowerCase();
  if (!EMAIL_PATTERN.test(email)) {
    throw new AppError(400, 'Please provide a valid email');
  }

  return email;
}

function parseEnum(value, allowed, requiredMessage, invalidMessage) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new AppError(400, requiredMessage);
  }

  const normalized = value.trim();
  if (!allowed.includes(normalized)) {
    throw new AppError(400, invalidMessage);
  }

  return normalized;
}

function parseActiveStatus(value, { required }) {
  if (value === undefined) {
    if (required) {
      throw new AppError(400, 'Active status is required');
    }

    return true;
  }

  if (typeof value !== 'boolean') {
    throw new AppError(400, 'Active status must be true or false');
  }

  return value;
}

function parseVerification(value, { defaultPending }) {
  if (value === undefined || value === null || value === '') {
    if (defaultPending) {
      return 'PENDING';
    }

    throw new AppError(400, 'Academic verification status is required');
  }

  return parseEnum(
    value,
    VERIFICATION_STATUSES,
    'Academic verification status is required',
    'Invalid verification status',
  );
}

function parseProfile(body, { defaultPending, requireActive }) {
  return {
    name: parseName(body?.name),
    email: parseEmail(body?.email),
    contributorRole: parseEnum(
      body?.contributorRole,
      CONTRIBUTOR_ROLES,
      'Contributor role is required',
      'Invalid contributor role',
    ),
    subject: parseEnum(body?.subject, SUBJECTS, 'Subject is required', 'Invalid subject'),
    academicVerificationStatus: parseVerification(body?.academicVerificationStatus, {
      defaultPending,
    }),
    isActive: parseActiveStatus(body?.isActive, { required: requireActive }),
  };
}

function parsePassword(value) {
  if (typeof value !== 'string' || value.length === 0) {
    throw new AppError(400, 'Password is required');
  }

  if (value.length < 8) {
    throw new AppError(400, 'Password must be at least 8 characters');
  }

  return value;
}

async function assertEmailAvailable(email, excludeId) {
  const existing = await User.findOne({ email });
  if (existing && String(existing._id) !== String(excludeId || '')) {
    throw new AppError(409, 'A user with that email already exists');
  }
}

async function listContributors() {
  const users = await User.find({ role: 'CONTRIBUTOR' }).sort({ name: 1, createdAt: 1 });
  return users.map((user) => user.toSafeObject());
}

async function getContributor(id) {
  const user = await findContributor(id);
  return user.toSafeObject();
}

async function createContributor(body, actor) {
  const profile = parseProfile(body, { defaultPending: true, requireActive: false });
  const password = parsePassword(body?.password);

  await assertEmailAvailable(profile.email);

  const user = await User.create({
    ...profile,
    password,
    role: 'CONTRIBUTOR',
  });

  await activityService.record({
    actorId: actor._id,
    action: 'CONTRIBUTOR_CREATED',
    entityType: 'Contributor',
    entityId: user._id,
    description: `${actor.name} created contributor ${user.name}.`,
    metadata: { contributorId: String(user._id) },
  });

  return user.toSafeObject();
}

async function updateContributor(id, body, actor) {
  const user = await findContributor(id);
  const wasActive = user.isActive !== false;
  const profile = parseProfile(body, { defaultPending: false, requireActive: true });

  await assertEmailAvailable(profile.email, user._id);

  user.name = profile.name;
  user.email = profile.email;
  user.contributorRole = profile.contributorRole;
  user.subject = profile.subject;
  user.academicVerificationStatus = profile.academicVerificationStatus;
  user.isActive = profile.isActive;
  await user.save();

  await activityService.record({
    actorId: actor._id,
    action: 'CONTRIBUTOR_UPDATED',
    entityType: 'Contributor',
    entityId: user._id,
    description: `${actor.name} updated contributor ${user.name}.`,
    metadata: { contributorId: String(user._id) },
  });

  if (wasActive !== profile.isActive) {
    await activityService.record({
      actorId: actor._id,
      action: profile.isActive ? 'CONTRIBUTOR_ACTIVATED' : 'CONTRIBUTOR_DEACTIVATED',
      entityType: 'Contributor',
      entityId: user._id,
      description: `${actor.name} ${profile.isActive ? 'activated' : 'deactivated'} contributor ${user.name}.`,
      metadata: { contributorId: String(user._id) },
    });
  }

  return user.toSafeObject();
}

async function updateStatus(id, isActive, actor) {
  if (typeof isActive !== 'boolean') {
    throw new AppError(400, 'Active status must be true or false');
  }

  const user = await findContributor(id);
  const wasActive = user.isActive !== false;
  if (wasActive === isActive) {
    return user.toSafeObject();
  }

  user.isActive = isActive;
  await user.save({ validateModifiedOnly: true });

  await activityService.record({
    actorId: actor._id,
    action: isActive ? 'CONTRIBUTOR_ACTIVATED' : 'CONTRIBUTOR_DEACTIVATED',
    entityType: 'Contributor',
    entityId: user._id,
    description: `${actor.name} ${isActive ? 'activated' : 'deactivated'} contributor ${user.name}.`,
    metadata: { contributorId: String(user._id) },
  });

  return user.toSafeObject();
}

async function updateVerification(id, academicVerificationStatus) {
  const status = parseVerification(academicVerificationStatus, { defaultPending: false });
  const user = await findContributor(id);
  user.academicVerificationStatus = status;
  await user.save({ validateModifiedOnly: true });

  return user.toSafeObject();
}

module.exports = {
  listContributors,
  getContributor,
  createContributor,
  updateContributor,
  updateStatus,
  updateVerification,
};
