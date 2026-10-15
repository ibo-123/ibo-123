export const CONTRIBUTOR_ROLES = [
  { value: 'QUESTION_CREATOR', label: 'Question Creator' },
  { value: 'SOLUTION_CREATOR', label: 'Solution Creator' },
  { value: 'RESOURCE_CURATOR', label: 'Resource Curator' },
] as const;

export const SUBJECTS = [
  { value: 'MATHEMATICS', label: 'Mathematics' },
  { value: 'PHYSICS', label: 'Physics' },
  { value: 'CHEMISTRY', label: 'Chemistry' },
  { value: 'BIOLOGY', label: 'Biology' },
  { value: 'ENGLISH', label: 'English' },
] as const;

export const VERIFICATION_STATUSES = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'VERIFIED', label: 'Verified' },
  { value: 'REJECTED', label: 'Rejected' },
] as const;

export type ContributorRole = (typeof CONTRIBUTOR_ROLES)[number]['value'];
export type Subject = (typeof SUBJECTS)[number]['value'];
export type AcademicVerificationStatus = (typeof VERIFICATION_STATUSES)[number]['value'];

export function contributorRoleLabel(value: string | null | undefined) {
  return CONTRIBUTOR_ROLES.find((item) => item.value === value)?.label ?? 'Not assigned';
}

export function subjectLabel(value: string | null | undefined) {
  return SUBJECTS.find((item) => item.value === value)?.label ?? 'Not assigned';
}

export function verificationLabel(value: string | null | undefined) {
  return VERIFICATION_STATUSES.find((item) => item.value === value)?.label ?? 'Not assigned';
}

export function accountStatusLabel(isActive: boolean) {
  return isActive ? 'Active' : 'Inactive';
}

export function isContributorRole(value: string): value is ContributorRole {
  return CONTRIBUTOR_ROLES.some((item) => item.value === value);
}

export function isSubject(value: string): value is Subject {
  return SUBJECTS.some((item) => item.value === value);
}

export function isVerificationStatus(value: string): value is AcademicVerificationStatus {
  return VERIFICATION_STATUSES.some((item) => item.value === value);
}
