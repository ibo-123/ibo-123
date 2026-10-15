import type {
  AcademicVerificationStatus,
  ContributorRole,
  Subject,
} from '../constants/contributors';

import type { Difficulty, JobStatus } from '../constants/jobs';
import type {
  FieldType,
  InputType,
  ProcessingStatus,
  ReviewDecision,
  SubmissionStatus,
  TemplateType,
} from '../constants/templates';

export type Role = 'ADMIN' | 'CONTRIBUTOR';

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive?: boolean;
  notificationPreferences?: NotificationPreferences;
  createdAt?: string;
  updatedAt?: string;
};

export type Contributor = {
  id: string;
  name: string;
  email: string;
  role: 'CONTRIBUTOR';
  contributorRole: ContributorRole | null;
  subject: Subject | null;
  isActive: boolean;
  academicVerificationStatus: AcademicVerificationStatus | null;
  createdAt: string;
  updatedAt: string;
};

export type ContributorWriteInput = {
  name: string;
  email: string;
  contributorRole: ContributorRole;
  subject: Subject;
  academicVerificationStatus: AcademicVerificationStatus;
  isActive: boolean;
};

export type ContributorCreateInput = ContributorWriteInput & {
  password: string;
};

export type TemplateField = {
  name: string;
  label: string;
  type: FieldType;
  required: boolean;
  order: number;
  placeholder: string;
  description: string;
  options: string[];
};

export type JobTemplateSummary = {
  id: string;
  name: string;
  subject: Subject;
  type: TemplateType;
  version: number;
  fields: TemplateField[];
};

export type Template = {
  id: string;
  name: string;
  description: string;
  subject: Subject;
  type: TemplateType;
  fields: TemplateField[];
  version: number;
  isActive: boolean;
  createdBy: { id: string; name: string } | string | null;
  createdAt: string;
  updatedAt: string;
};

export type TemplateWriteInput = {
  name: string;
  description: string;
  subject: Subject;
  type: TemplateType;
  fields: TemplateField[];
  isActive: boolean;
};

export type JobSubmissionProgress = {
  required: number;
  submitted: number;
  percentage: number;
  submissionStatus: SubmissionStatus | null;
  submissionId: string | null;
};

export type ContributorJob = {
  id: string;
  title: string;
  description: string;
  requirements: string;
  subject: Subject;
  topic: string;
  quantity: number;
  difficulty: Difficulty;
  deadline: string;
  instructions: string;
  status: JobStatus;
  template: JobTemplateSummary | null;
  jobType?: string;
  assignedDate?: string;
  submissionProgress?: JobSubmissionProgress;
  createdAt: string;
  updatedAt: string;
};

export type Job = ContributorJob & {
  contributor: {
    id: string;
    name: string;
    email: string;
    subject: Subject | null;
    isActive: boolean;
  } | null;
  createdBy: { id: string; name: string } | null;
};

export type JobWriteInput = {
  title: string;
  description: string;
  requirements: string;
  subject: Subject;
  topic: string;
  quantity: number;
  difficulty: Difficulty;
  deadline: string;
  instructions: string;
  contributor: string | null;
  status: JobStatus;
  template: string | null;
};

export type SubmissionFile = {
  id: string;
  originalName: string;
  mimeType: string;
  size: number;
  order?: number;
  uploadedAt: string;
};

export type SubmissionItem = {
  order: number;
  values: Record<string, string | number | null>;
};

export type TopicResource = {
  subject: Subject;
  topic: string;
  resourceName: string;
  pageFrom: number;
  pageTo: number;
  prerequisites: string[];
  inputType: InputType;
  rawContent?: string;
  extractedContent?: string;
  normalizedContent?: string;
  processingStatus: ProcessingStatus;
  processingError?: string;
};

export type TopicItem = {
  id: string;
  name: string;
  subject: Subject;
  prerequisites: string[];
  isCurriculumStandard: boolean;
};

export type SubmissionVersion = {
  number: number;
  notes: string;
  topicResource?: TopicResource | null;
  items: SubmissionItem[];
  files: SubmissionFile[];
  submittedAt: string;
};

export type SubmissionReview = {
  id: string;
  version: number;
  decision: ReviewDecision;
  feedback: string;
  createdAt: string;
  reviewer: { id: string; name?: string };
};

export type Submission = {
  id: string;
  submissionType?: 'TEMPLATE' | 'TOPIC_RESOURCE';
  job?: {
    id: string;
    title?: string;
    subject?: Subject;
    topic?: string;
    quantity?: number;
    difficulty?: Difficulty;
    deadline?: string;
    status?: JobStatus;
  } | null;
  template?: JobTemplateSummary | null;
  topicResource?: TopicResource | null;
  items: SubmissionItem[];
  files: SubmissionFile[];
  notes: string;
  status: SubmissionStatus;
  currentVersion: number;
  approvedVersion: number | null;
  contentReadyAt: string | null;
  versions?: SubmissionVersion[];
  reviews?: SubmissionReview[];
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string;
  contributor?: { id: string; name: string; email: string };
};

export type ContributorDashboardData = {
  message: string;
  name: string;
  role: string;
  metrics: {
    assignedJobs: number;
    activeJobs: number;
    pendingSubmissions: number;
    submissionsRequiringRevision: number;
    approvedSubmissions: number;
  };
  upcomingDeadlines: Array<{
    id: string;
    title: string;
    subject: Subject;
    topic: string;
    deadline: string;
    status: JobStatus;
  }>;
  recentActivity: Array<{
    id: string;
    action: string;
    description: string;
    createdAt: string;
    actor?: { name: string } | null;
  }>;
};

export type NotificationPreferences = {
  emailNotifications: boolean;
  inAppNotifications: boolean;
};

export type NotificationItem = {
  id: string;
  type: string;
  title: string;
  message: string;
  relatedEntityType: string;
  relatedEntityId: string;
  link: string;
  isRead: boolean;
  emailSent?: boolean;
  createdAt: string;
};

export type ActivityEntry = {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  description: string;
  createdAt: string;
  actor: { id: string; name?: string };
};

export type LoginResult = {
  token: string;
  user: User;
};
