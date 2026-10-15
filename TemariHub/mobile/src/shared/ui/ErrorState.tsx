import { StateFrame } from './StateFrame';

export type ErrorStateProps = {
  message: string;
  onRetry: () => void;
  title?: string;
  retryLabel?: string;
  eyebrow?: string;
  /** Shows the button spinner while a retry is in flight. */
  retrying?: boolean;
};

export function ErrorState({
  message,
  onRetry,
  title = "This didn't load",
  retryLabel = 'Try again',
  eyebrow = "Didn't load",
  retrying = false,
}: ErrorStateProps) {
  return (
    <StateFrame
      tone="error"
      eyebrow={eyebrow}
      title={title}
      message={message}
      actionLabel={retryLabel}
      onAction={onRetry}
      loading={retrying}
      testID="error-state"
    />
  );
}
