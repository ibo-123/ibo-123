const ActivityLog = require('../models/ActivityLog');
const AppError = require('../utils/AppError');
const { ACTIVITY_ENTITY_TYPES } = require('../constants/activity');

const OBJECT_ID_PATTERN = /^[a-fA-F0-9]{24}$/;

function serializeActivity(entry) {
  const actor = entry.actor;
  return {
    id: entry._id,
    action: entry.action,
    entityType: entry.entityType,
    entityId: entry.entityId,
    description: entry.description,
    metadata: entry.metadata || {},
    createdAt: entry.createdAt,
    actor: actor && actor.name
      ? { id: actor._id, name: actor.name }
      : { id: actor },
  };
}

async function record(entry) {
  const created = await ActivityLog.create({
    actor: entry.actorId,
    action: entry.action,
    entityType: entry.entityType,
    entityId: entry.entityId,
    description: entry.description,
    metadata: entry.metadata || {},
  });
  return created;
}

async function listActivity({ entityType, entityId } = {}) {
  const hasType = entityType !== undefined && entityType !== null && entityType !== '';
  const hasId = entityId !== undefined && entityId !== null && entityId !== '';

  if (hasType !== hasId) {
    throw new AppError(400, 'Entity type and entity ID are both required to filter history');
  }

  let filter = {};

  if (hasType) {
    if (!ACTIVITY_ENTITY_TYPES.includes(entityType)) {
      throw new AppError(400, 'Invalid entity type');
    }
    if (typeof entityId !== 'string' || !OBJECT_ID_PATTERN.test(entityId)) {
      throw new AppError(400, 'Invalid entity ID');
    }

    const matches = [{ entityType, entityId }];
    if (entityType === 'Job') {
      matches.push({ 'metadata.jobId': entityId });
    }
    if (entityType === 'Contributor') {
      matches.push({ 'metadata.contributorId': entityId });
    }
    if (entityType === 'Submission') {
      matches.push({ 'metadata.submissionId': entityId });
    }
    filter = { $or: matches };
  }

  const entries = await ActivityLog.find(filter)
    .sort({ createdAt: -1, _id: -1 })
    .limit(hasType ? 50 : 100)
    .populate('actor', 'name');

  return entries.map(serializeActivity);
}

module.exports = {
  record,
  listActivity,
};
