import React, { useState } from 'react';
import WeatherDisplay from './WeatherDisplay';
import NewsPanel from './NewsPanel';

const WeatherAndNewsTabs: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'weather' | 'news'>('weather');

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="mt-6"></div>
      <div className="bg-gray-100 dark:bg-gray-800 rounded-t-lg p-1 flex space-x-1">
        <button
          className={`w-full py-2.5 text-sm font-medium leading-5 rounded-lg
            ${activeTab === 'weather'
              ? 'bg-white dark:bg-gray-700 shadow text-blue-700 dark:text-blue-300'
              : 'text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-gray-700/50'
            }
            focus:outline-none focus:ring-2 ring-offset-2 ring-offset-blue-400 ring-white ring-opacity-60`}
          onClick={() => setActiveTab('weather')}
        >
          天氣資訊
        </button>
        <button
          className={`w-full py-2.5 text-sm font-medium leading-5 rounded-lg
            ${activeTab === 'news'
              ? 'bg-white dark:bg-gray-700 shadow text-blue-700 dark:text-blue-300'
              : 'text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-gray-700/50'
            }
            focus:outline-none focus:ring-2 ring-offset-2 ring-offset-blue-400 ring-white ring-opacity-60`}
          onClick={() => setActiveTab('news')}
        >
          交通新聞
        </button>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-b-lg shadow-md">
        <div className="p-4">
            {activeTab === 'weather' && <WeatherDisplay />}
            {activeTab === 'news' && <NewsPanel />}
        </div>
      </div>
    </div>
  );
};

export default WeatherAndNewsTabs;