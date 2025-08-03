import React from 'react';

interface LoaderProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
}

const Loader: React.FC<LoaderProps> = ({ message, size = 'medium' }) => {
  const sizeClasses = {
    small: 'w-5 h-5 border-2',
    medium: 'w-8 h-8 border-3',
    large: 'w-12 h-12 border-4'
  };

  return (
    <div className={`flex flex-col items-center justify-center ${size !== 'small' ? 'py-10' : 'py-0'} text-gray-500 dark:text-gray-400`}>
      <div className={`${sizeClasses[size]} border-[color:var(--accent)] border-t-transparent rounded-full animate-spin`}></div>
      {message && <p className={`mt-4 ${size === 'small' ? 'text-sm' : 'text-lg'} font-medium`}>{message}</p>}
    </div>
  );
};

export default Loader;