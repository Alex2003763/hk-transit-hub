import React from 'react';

interface ErrorDisplayProps {
  message: string;
  rawResponse?: string | null;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ message, rawResponse }) => {
  return (
    <div className="bg-gradient-to-br from-red-100 via-white to-red-50 dark:from-red-900 dark:via-gray-800 dark:to-red-900 border border-red-300 dark:border-red-500/50 text-red-700 dark:text-red-300 px-6 py-4 rounded-2xl shadow-2xl space-y-3 animate-fade-in" role="alert">
      <div className="flex items-start gap-3">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 flex-shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div>
          <strong className="font-bold block">Error</strong>
          <span className="block text-sm">{message}</span>
        </div>
      </div>
      {rawResponse && (
        <div className="mt-2">
          <strong className="font-bold block text-sm">AI Raw Response:</strong>
          <pre className="bg-gray-100 dark:bg-gray-800 p-2 rounded-md text-xs whitespace-pre-wrap break-all">
            {rawResponse}
          </pre>
        </div>
      )}
    </div>
  );
};

export default ErrorDisplay;