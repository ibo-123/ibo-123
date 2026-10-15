/** Public API for the content domain. Cross-domain imports must use this barrel. */
export { fetchQuestion } from './api';
export { QuietChoiceList } from './components/QuietChoiceList';
export { questionQueryKey, usePrefetchQuestion, useQuestion } from './hooks/useQuestion';
export { readStudentQuestion } from './schemas';
export type { QuestionOption, QuestionRef, StudentQuestion } from './types';
