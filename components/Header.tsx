import React from 'react';

interface HeaderProps {
  onBack: () => void;
  showBack: boolean;
}

const Header: React.FC<HeaderProps> = ({ onBack, showBack }) => {

  return (
    <header className="bg-gradient-to-r from-teal-100 via-white to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 backdrop-blur-md sticky top-0 z-30 h-16 border-b border-teal-300 dark:border-teal-700 shadow-lg">
      <div className="max-w-4xl mx-auto px-4 flex items-center justify-between h-full">
        <div className="w-24 text-left">
          {showBack && (
            <button onClick={onBack} className="text-teal-600 hover:text-teal-800 transition-all duration-200 flex items-center group -ml-2 p-2 rounded-full hover:bg-teal-100 dark:hover:bg-teal-900 focus:outline-none focus:ring-2 focus:ring-teal-400 shadow-md">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              <span className="ml-1 font-bold text-base">Back</span>
            </button>
          )}
        </div>
        
        <div className="text-xl sm:text-2xl font-extrabold text-teal-900 dark:text-teal-200 flex items-center gap-2 absolute left-1/2 -translate-x-1/2 drop-shadow-lg rounded-xl transition-all duration-300">
           <svg width="28" height="28" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="100" height="100" rx="22" fill="#112244"/>
              <path d="M25 35H68C71.3137 35 74 37.6863 74 41V41C68.5 41 65 45.5 65 50C65 54.5 68.5 59 74 59V59C74 62.3137 71.3137 65 68 65H25" stroke="#00F5D4" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          <span className="hidden sm:inline tracking-tight">HK Transit Hub</span>
        </div>

        <div className="w-24"></div> {/* Placeholder for alignment */}
      </div>
    </header>
  );
};

export default Header;