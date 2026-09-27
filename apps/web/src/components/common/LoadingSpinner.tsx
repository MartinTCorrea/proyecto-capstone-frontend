import React from 'react';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = 'Cargando información...',
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col items-center justify-center p-8 space-y-3"
    >
      <div
        className={`${sizeClasses[size]} border-blue-200 border-t-blue-600 rounded-full animate-spin`}
      />
      {message && <p className="text-sm font-medium text-slate-600">{message}</p>}
      <span className="sr-only">{message}</span>
    </div>
  );
};

export default LoadingSpinner;
