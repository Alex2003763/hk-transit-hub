import React from 'react';

interface HeaderProps {
  onBack: () => void;
  showBack: boolean;
}

const Header: React.FC<HeaderProps> = ({ onBack, showBack }) => {

  return (
    <header className="bg-gray-50/80 dark:bg-gray-900/80 backdrop-blur-md sticky top-0 z-20 h-16 border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-4xl mx-auto px-4 flex items-center justify-between h-full">
        
        
        <div className="text-lg font-extrabold text-gray-800 dark:text-white flex items-center gap-2 absolute left-1/2 -translate-x-1/2">
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