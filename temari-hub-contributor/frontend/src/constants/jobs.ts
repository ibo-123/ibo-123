export const JOB_STATUSES = [
  { value: 'DRAFT', label: 'Draft' },
  { value: 'ASSIGNED', label: 'Assigned' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
] as const;

export const DIFFICULTIES = [
  { value: 'EASY', label: 'Easy' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HARD', label: 'Hard' },
] as const;

export type JobStatus = (typeof JOB_STATUSES)[number]['value'];
export type Difficulty = (typeof DIFFICULTIES)[number]['value'];

// Mirrors the backend rules. The backend is the source of truth.
export const STATUS_TRANSITIONS: Record<JobStatus, JobStatus[]> = {
  DRAFT: ['ASSIGNED', 'CANCELLED'],
  ASSIGNED: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
};

export function jobStatusLabel(value: string) {
  return JOB_STATUSES.find((item) => item.value === value)?.label ?? value;
}

export function difficultyLabel(value: string) {
  return DIFFICULTIES.find((item) => item.value === value)?.label ?? value;
}

export function isJobStatus(value: string): value is JobStatus {
  return JOB_STATUSES.some((item) => item.value === value);
}

export function isDifficulty(value: string): value is Difficulty {
  return DIFFICULTIES.some((item) => item.value === value);
}

export function canEditJob(status: JobStatus) {
  return status !== 'CANCELLED' && status !== 'COMPLETED';
}

export function canCancelJob(status: JobStatus) {
  return STATUS_TRANSITIONS[status].includes('CANCELLED');
}

// Deadlines are stored as UTC instants; show the UTC calendar day so every
// viewer sees the same date the Admin picked (for example "October 15, 2026").
export function formatDeadline(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('en-US', { dateStyle: 'long', timeZone: 'UTC' }).format(date);
}

// Value for <input type="date"> (YYYY-MM-DD, UTC day).
export function toDateInputValue(value: string) {
  return value.slice(0, 10);
}

export function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

export function deadlineHasPassed(value: string) {
  const date = new Date(value);
  return !Number.isNaN(date.getTime()) && date.getTime() < Date.now();
}

export const CANCEL_CONFIRMATION = 'Are you sure you want to cancel this job?';
