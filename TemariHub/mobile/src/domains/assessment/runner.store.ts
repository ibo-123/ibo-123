import { create } from 'zustand';

import type { DiagnosticStart } from './types';

type RunnerStore = {
  /** In-memory start payloads for the current session (resume is MOB-41). */
  attempts: Record<string, DiagnosticStart>;
  setAttempt: (start: DiagnosticStart) => void;
  getAttempt: (testId: string) => DiagnosticStart | undefined;
  clearAttempt: (testId: string) => void;
};

export const useRunnerStore = create<RunnerStore>((set, get) => ({
  attempts: {},
  setAttempt: (start) =>
    set((state) => ({
      attempts: { ...state.attempts, [start.test_id]: start },
    })),
  getAttempt: (testId) => get().attempts[testId],
  clearAttempt: (testId) =>
    set((state) => {
      const next = { ...state.attempts };
      delete next[testId];
      return { attempts: next };
    }),
}));
