/** Public API for the assessment domain. Cross-domain imports must use this barrel. */
export { startDiagnostic, submitDiagnosticAnswer } from './api';
export { SectionProgress } from './components/SectionProgress';
export { flattenSections } from './lib/flattenSections';
export { readDiagnosticAnswerResult, readDiagnosticStart } from './schemas';
export { DiagnosticIntroScreen } from './screens/DiagnosticIntroScreen';
export { DiagnosticRunnerScreen } from './screens/DiagnosticRunnerScreen';
export type {
  DiagnosticAnswerRequest,
  DiagnosticAnswerResult,
  DiagnosticSection,
  DiagnosticStart,
  RunnerItem,
} from './types';
