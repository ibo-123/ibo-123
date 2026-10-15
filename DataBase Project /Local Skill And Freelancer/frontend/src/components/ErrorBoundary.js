import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-red-50 text-red-900 px-4">
          <div className="max-w-lg">
            <h1 className="text-2xl font-bold mb-3">Something went wrong.</h1>
            <p className="mb-4">Please refresh the page or try again later.</p>
            <pre className="whitespace-pre-wrap text-sm bg-white p-3 rounded shadow-sm">
              {this.state.error?.toString()}
            </pre>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
