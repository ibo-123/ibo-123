import React from 'react';
import PropTypes from 'prop-types';

const LoadingSpinner = ({
  size = 'md',
  color = 'blue',
  variant = 'default',
  text = '',
  textPosition = 'bottom',
  fullScreen = false,
  overlay = false,
  className = ''
}) => {

  // Safe Tailwind classes (NO dynamic strings)
  const sizes = {
    xs: 'h-4 w-4 border-2',
    sm: 'h-6 w-6 border-2',
    md: 'h-10 w-10 border-4',
    lg: 'h-14 w-14 border-4',
    xl: 'h-20 w-20 border-4'
  };

  const colorMap = {
    blue: 'border-blue-600',
    purple: 'border-purple-600',
    green: 'border-green-600',
    red: 'border-red-600',
    yellow: 'border-yellow-500',
    indigo: 'border-indigo-600',
    pink: 'border-pink-600',
    gray: 'border-gray-600',
    white: 'border-white'
  };

  const dotColorMap = {
    blue: 'bg-blue-600',
    purple: 'bg-purple-600',
    green: 'bg-green-600',
    red: 'bg-red-600',
    yellow: 'bg-yellow-500',
    indigo: 'bg-indigo-600',
    pink: 'bg-pink-600',
    gray: 'bg-gray-600',
    white: 'bg-white'
  };

  const textPositions = {
    top: 'flex-col-reverse',
    bottom: 'flex-col',
    left: 'flex-row items-center gap-3',
    right: 'flex-row-reverse items-center gap-3'
  };

  const spinnerClass = `
    rounded-full animate-spin
    ${sizes[size]}
    ${colorMap[color]}
    border-t-transparent
  `;

  const containerClass = fullScreen
    ? 'fixed inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-50'
    : overlay
    ? 'absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-sm z-10'
    : `flex ${textPositions[textPosition]} items-center justify-center ${className}`;

  const renderDots = () => {
    const dotSize = size === 'xs' ? 6 : size === 'sm' ? 8 : size === 'md' ? 10 : size === 'lg' ? 12 : 14;

    return (
      <div className="flex space-x-2 items-center">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`rounded-full ${dotColorMap[color]} animate-bounce`}
            style={{
              width: dotSize,
              height: dotSize,
              animationDelay: `${i * 0.15}s`
            }}
          />
        ))}
      </div>
    );
  };

  const renderSpinner = () => {
    if (variant === 'dots') return renderDots();
    return <div className={spinnerClass} role="status" />;
  };

  return (
    <div className={containerClass} role="status" aria-label={text || 'Loading'}>
      {renderSpinner()}

      {text && (
        <p className={`text-sm font-medium mt-3 text-gray-600`}>
          {text}
        </p>
      )}
    </div>
  );
};

LoadingSpinner.propTypes = {
  size: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl']),
  color: PropTypes.oneOf(['blue', 'purple', 'green', 'red', 'yellow', 'indigo', 'pink', 'gray', 'white']),
  variant: PropTypes.oneOf(['default', 'dots', 'pulse', 'ring', 'double']),
  text: PropTypes.string,
  textPosition: PropTypes.oneOf(['top', 'bottom', 'left', 'right']),
  fullScreen: PropTypes.bool,
  overlay: PropTypes.bool,
  className: PropTypes.string
};

export default LoadingSpinner;