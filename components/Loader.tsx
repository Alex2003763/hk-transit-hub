import React from 'react';

interface LoaderProps {
  message?: string;
}

const Loader: React.FC<LoaderProps> = ({ message }) => {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-gray-500 dark:text-gray-400">
      <div className="w-12 h-12 border-4 border-[color:var(--accent)] border-t-transparent rounded-full animate-spin"></div>
      {message && <p className="mt-4 text-lg font-medium">{message}</p>}
    </div>
  );
};

export default Loader;