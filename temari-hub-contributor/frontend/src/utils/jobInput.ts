import type { JobFormValues } from '../components/JobForm';
import { isSubject } from '../constants/contributors';
import { isDifficulty, isJobStatus } from '../constants/jobs';
import type { JobWriteInput } from '../types';

// Converts form strings into the API payload. The backend validates again.
export function buildJobInput(values: JobFormValues): JobWriteInput | string {
  const quantity = Number(values.quantity);

  if (!Number.isInteger(quantity) || quantity < 1) {
    return 'Quantity must be a positive whole number';
  }

  if (
    !isSubject(values.subject) ||
    !isDifficulty(values.difficulty) ||
    !isJobStatus(values.status)
  ) {
    return 'Choose a valid subject, difficulty, and status';
  }

  return {
    title: values.title,
    description: values.description,
    requirements: values.requirements,
    subject: values.subject,
    topic: values.topic,
    quantity,
    difficulty: values.difficulty,
    deadline: values.deadline,
    instructions: values.instructions,
    contributor: values.contributor || null,
    status: values.status,
    template: values.template || null,
  };
}
