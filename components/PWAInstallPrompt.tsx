import React from 'react';

interface PWAInstallPromptProps {
  onInstall: () => void;
  onDismiss: () => void;
  show: boolean;
}

const PWAInstallPrompt: React.FC<PWAInstallPromptProps> = ({ onInstall, onDismiss, show }) => {
  if (!show) return null;

  return (
    <div className="fixed top-4 left-4 right-4 z-50 animate-fade-in">
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg shadow-lg p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium">
              Install HK Transit Hub
            </h3>
            <p className="text-sm opacity-90 mt-1">
              Install this app on your device for quick access and offline functionality.
            </p>
            <div className="mt-3 flex space-x-2">
              <button
                onClick={onInstall}
                className="inline-flex items-center px-3 py-1.5 border border-white border-opacity-30 text-xs font-medium rounded text-white bg-white bg-opacity-20 hover:bg-opacity-30 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 transition-all"
              >
                Install
              </button>
              <button
                onClick={onDismiss}
                className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded text-white hover:bg-white hover:bg-opacity-10 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 transition-all"
              >
                Not Now
              </button>
            </div>
          </div>
          <div className="flex-shrink-0">
            <button
              onClick={onDismiss}
              className="text-white hover:text-opacity-80 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PWAInstallPrompt;
