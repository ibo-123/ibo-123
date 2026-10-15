import { StateFrame } from './StateFrame';

export type EmptyStateAction = {
  label: string;
  onPress: () => void;
};

export type EmptyStateProps = {
  title: string;
  message: string;
  /** Exactly one next step. Empty screens don't get a second button. */
  action: EmptyStateAction;
  eyebrow?: string;
};

export function EmptyState({ title, message, action, eyebrow = 'Nothing yet' }: EmptyStateProps) {
  return (
    <StateFrame
      tone="empty"
      eyebrow={eyebrow}
      title={title}
      message={message}
      actionLabel={action.label}
      onAction={action.onPress}
      testID="empty-state"
    />
  );
}
