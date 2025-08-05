import React from 'react';

interface SafariInstallPromptProps {
  onDismiss: () => void;
  show: boolean;
}

const SafariInstallPrompt: React.FC<SafariInstallPromptProps> = ({ onDismiss, show }) => {
  if (!show) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 animate-fade-in">
      <div className="bg-gray-800 text-white rounded-lg shadow-lg p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium">
              Add to Home Screen
            </h3>
            <p className="text-sm opacity-90 mt-1">
              To install the app, tap the <b>Share</b> button (<svg className="inline w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{verticalAlign: 'middle'}}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 12v.01M12 4v16m8-8v.01M16 8l-4-4-4 4" /></svg>)
              and then <b>'Add to Home Screen'</b>.
              <br />
              <span className="block mt-2 text-yellow-300 font-semibold">
                <b>Note:</b> Only after adding to Home Screen can you use the app offline on iPhone/Safari.
              </span>
            </p>
            <div className="mt-3 flex">
              <button
                onClick={onDismiss}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Got it
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

export default SafariInstallPrompt;