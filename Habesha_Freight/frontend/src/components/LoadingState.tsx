interface LoadingStateProps {
  message?: string;
}

export default function LoadingState({ message = 'Loading...' }: LoadingStateProps) {
  return (
    <div className="p2-loading-state">
      <div className="p2-spinner" />
      <p>{message}</p>
    </div>
  );
}
