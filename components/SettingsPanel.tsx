import React, { useState, useEffect } from 'react';

type Theme = 'light' | 'dark';
interface SettingsPanelProps {
    currentApiKey: string;
    onSaveApiKey: (key: string) => void;
    theme: Theme;
    setTheme: (theme: Theme) => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ currentApiKey, onSaveApiKey, theme, setTheme }) => {
    const [apiKeyInput, setApiKeyInput] = useState(currentApiKey);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        setApiKeyInput(currentApiKey);
    }, [currentApiKey]);

    const handleSave = () => {
        onSaveApiKey(apiKeyInput);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000); // Hide message after 2s
    };
    
    const handleThemeChange = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';

        setTheme(newTheme);
    };

    const handleResetTheme = () => {
        // Clear stored theme preference and use default (dark) theme
        localStorage.removeItem('theme');
        setTheme('dark');
    };

  return (
    <div className="bg-gradient-to-br from-teal-50 via-white to-teal-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-8 rounded-3xl shadow-2xl space-y-10 animate-fade-in border border-teal-200 dark:border-teal-700 mt-6 transition-all">
      <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white text-center tracking-tight mb-2">Settings</h2>
      
      <div className="space-y-6">
        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-4">Appearance</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 p-5 rounded-xl shadow-md">
            <label htmlFor="dark-mode-toggle" className="text-gray-800 dark:text-white font-medium flex items-center gap-3 text-lg">
              {theme === 'dark' ?
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                  :
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              }
              {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
            </label>
            <button
              onClick={handleThemeChange}
              className={`relative inline-flex items-center h-8 rounded-full w-16 transition-colors duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 focus:ring-[color:var(--accent)] ${theme === 'dark' ? 'bg-[color:var(--accent)]' : 'bg-gray-300'}`}
            >
              <span className={`inline-block w-7 h-7 transform transition-transform duration-300 ease-in-out bg-white rounded-full shadow ${theme === 'dark' ? 'translate-x-8' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};

export default SettingsPanel;