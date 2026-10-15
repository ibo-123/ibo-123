import type { ReactNode } from 'react';

import { SkeletonScreen } from './Skeleton';

export type QueryPhase = 'loading' | 'empty' | 'error' | 'ready';

export type QueryStateProps = {
  phase: QueryPhase;
  empty: ReactNode;
  error: ReactNode;
  children: ReactNode;
  /** Defaults to `SkeletonScreen`. */
  loading?: ReactNode;
};

/** Picks the one honest state for a screen. Feature screens pass their own copy. */
export function QueryState({ phase, empty, error, children, loading }: QueryStateProps) {
  switch (phase) {
    case 'loading':
      return <>{loading ?? <SkeletonScreen />}</>;
    case 'empty':
      return <>{empty}</>;
    case 'error':
      return <>{error}</>;
    case 'ready':
      return <>{children}</>;
  }
}
