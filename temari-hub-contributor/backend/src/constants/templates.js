const TEMPLATE_TYPES = ['QUESTION', 'SOLUTION', 'RESOURCE'];

const FIELD_TYPES = ['text', 'textarea', 'number', 'select'];

const SUBMISSION_STATUSES = [
  'DRAFT',
  'SUBMITTED',
  'UNDER_REVIEW',
  'REVISION_REQUIRED',
  'APPROVED',
  'REJECTED',
  'CONTENT_READY',
];

const INPUT_TYPES = ['TEXT', 'PDF', 'DOC', 'DOCX', 'IMAGE'];

const PROCESSING_STATUSES = ['PENDING', 'PROCESSING', 'PROCESSED', 'PROCESSING_FAILED'];

const REVIEW_DECISIONS = ['APPROVED', 'REVISION_REQUIRED', 'REJECTED'];

const EDITABLE_SUBMISSION_STATUSES = ['DRAFT', 'REVISION_REQUIRED'];

const REVIEWABLE_SUBMISSION_STATUSES = ['SUBMITTED', 'UNDER_REVIEW'];

// Document and image formats a submission may attach. Executables are excluded.
const ALLOWED_FILE_TYPES = {
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'text/plain': ['.txt'],
  'text/csv': ['.csv'],
  'image/png': ['.png'],
  'image/jpeg': ['.jpg', '.jpeg'],
};

const OPEN_JOB_STATUSES = ['ASSIGNED', 'IN_PROGRESS'];

module.exports = {
  TEMPLATE_TYPES,
  FIELD_TYPES,
  SUBMISSION_STATUSES,
  INPUT_TYPES,
  PROCESSING_STATUSES,
  REVIEW_DECISIONS,
  EDITABLE_SUBMISSION_STATUSES,
  REVIEWABLE_SUBMISSION_STATUSES,
  ALLOWED_FILE_TYPES,
  OPEN_JOB_STATUSES,
};
