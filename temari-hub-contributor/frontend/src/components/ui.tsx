import type { ReactNode } from 'react';
import { Icon } from './Icons';

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow ? <div className="mb-2 text-sm text-slate-500">{eyebrow}</div> : null}
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">{title}</h2>
        {description ? <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function Alert({ tone = 'error', children }: { tone?: 'error' | 'warning' | 'success'; children: ReactNode }) {
  const tones = {
    error: 'border-red-200 bg-red-50 text-red-700',
    warning: 'border-amber-200 bg-amber-50 text-amber-900',
    success: 'border-green-200 bg-green-50 text-green-800',
  };

  return <p className={`mb-4 rounded-xl border px-4 py-3 text-sm ${tones[tone]}`}>{children}</p>;
}

export function EmptyState({
  title,
  children,
  action,
}: {
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="px-6 py-12 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
        <Icon name="folder" className="h-6 w-6" />
      </div>
      <p className="text-base font-medium text-slate-900">{title}</p>
      {children ? <p className="mx-auto mt-1.5 max-w-md text-sm text-slate-500 leading-relaxed">{children}</p> : null}
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function LoadingState({ children = 'Loading…' }: { children?: ReactNode }) {
  return (
    <div className="flex items-center justify-center gap-3 px-6 py-12 text-center">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
      <span className="text-sm font-medium text-slate-500">{children}</span>
    </div>
  );
}

export function LoadingSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-4 p-6">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="animate-pulse space-y-2">
          <div className="h-4 bg-slate-200 rounded w-3/4"></div>
          <div className="h-3 bg-slate-100 rounded w-1/2"></div>
        </div>
      ))}
    </div>
  );
}

export function ErrorState({
  message = "We couldn't load this information.",
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="rounded-3xl border border-red-100 bg-white/80 p-8 text-center shadow-sm backdrop-blur-sm">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-500">
        <Icon name="alert" className="h-6 w-6" />
      </div>
      <h3 className="text-base font-semibold text-slate-900">Something went wrong.</h3>
      <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">{message}</p>
      {onRetry ? (
        <div className="mt-5">
          <button
            type="button"
            onClick={onRetry}
            className="rounded-full bg-slate-900 px-5 py-2 text-xs font-medium text-white shadow-sm transition hover:bg-slate-800"
          >
            Try Again
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function Panel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`}>{children}</section>
  );
}
