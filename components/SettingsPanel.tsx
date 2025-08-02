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
        setTheme(theme === 'light' ? 'dark' : 'light');
    };

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg space-y-8 animate-fade-in border border-gray-200 dark:border-gray-700 mt-4">
      <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white text-center tracking-tight">Settings</h2>
      
      <div className="space-y-3">
        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-3">API Configuration</h3>
        <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg space-y-4">
             <div>
                <label htmlFor="api-key-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Gemini API Key
                </label>
                <input
                    id="api-key-input"
                    type="password"
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    placeholder="Enter your Gemini API Key"
                    className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg p-3 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)] transition-all"
                />
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-xs">
                Your API key is stored only in your browser's local storage and is never sent to any server besides Google's.
            </p>
            <div className="flex items-center gap-4 pt-2">
                <button
                    onClick={handleSave}
                    className="bg-[color:var(--accent)] text-[color:var(--accent-text)] font-bold py-2 px-5 rounded-lg transition-all duration-300 hover:bg-[color:var(--accent-hover)] shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                >
                    Save Key
                </button>
                {saved && <p className="text-green-600 dark:text-green-400 text-sm font-semibold animate-fade-in">✓ Saved!</p>}
            </div>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-3">Appearance</h3>
        <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
          <label htmlFor="dark-mode-toggle" className="text-gray-800 dark:text-white font-medium flex items-center gap-3">
            {theme === 'dark' ? 
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                : 
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            }
            {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
          </label>
          <button onClick={handleThemeChange} className={`relative inline-flex items-center h-7 rounded-full w-12 transition-colors duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 focus:ring-[color:var(--accent)] ${theme === 'dark' ? 'bg-[color:var(--accent)]' : 'bg-gray-300'}`}>
            <span className={`inline-block w-5 h-5 transform transition-transform duration-300 ease-in-out bg-white rounded-full ${theme === 'dark' ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>
      </div>

    </div>
  );
};

export default SettingsPanel;