import React from 'react';
import { Plane } from 'lucide-react';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = 'Loading...',
  size = 'md',
}) => {
  const iconSizes = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-4">
      <div className="relative">
        <div className="w-14 h-14 rounded-full border-4 border-sky-100 border-t-sky-600 animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center text-sky-600">
          <Plane className={`${iconSizes[size]} animate-pulse`} />
        </div>
      </div>
      {message && <p className="text-sm font-medium text-slate-600 tracking-wide">{message}</p>}
    </div>
  );
};
