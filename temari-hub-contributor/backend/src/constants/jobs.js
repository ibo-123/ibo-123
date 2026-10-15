const JOB_STATUSES = ['DRAFT', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

const DIFFICULTIES = ['EASY', 'MEDIUM', 'HARD'];

// Allowed status changes. A status can always stay the same.
const STATUS_TRANSITIONS = {
  DRAFT: ['ASSIGNED', 'CANCELLED'],
  ASSIGNED: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
};

// Statuses a new job may start with.
const CREATION_STATUSES = ['DRAFT', 'ASSIGNED'];

// Statuses that require an assigned contributor.
const ASSIGNED_STATUSES = ['ASSIGNED', 'IN_PROGRESS', 'COMPLETED'];

// Contributors only see jobs that have been assigned to them and not cancelled.
const CONTRIBUTOR_VISIBLE_STATUSES = ['ASSIGNED', 'IN_PROGRESS', 'COMPLETED'];

module.exports = {
  JOB_STATUSES,
  DIFFICULTIES,
  STATUS_TRANSITIONS,
  CREATION_STATUSES,
  ASSIGNED_STATUSES,
  CONTRIBUTOR_VISIBLE_STATUSES,
};
