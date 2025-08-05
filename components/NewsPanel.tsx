import React, { useState } from 'react';
import { useNews } from '../hooks/useNews';
import Loader from './Loader';
import ErrorDisplay from './ErrorDisplay';
import NewsCard from './NewsCard';
import RefreshIcon from './icons/RefreshIcon';

const NewsPanel: React.FC = () => {
  const [language, setLanguage] = useState<'tc' | 'en'>('tc');
  const { news, loading, error, lastUpdated, refetch } = useNews(language);
  const [expandedNews, setExpandedNews] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedNews(expandedNews === id ? null : id);
  };

  const formatTime = (date: Date | null) => {
    if (!date) return '';
    return date.toLocaleString(language === 'tc' ? 'zh-HK' : 'en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-teal-50/80 via-white/70 to-teal-100/80 dark:from-gray-900/80 dark:via-gray-800/70 dark:to-gray-900/80 p-6 sm:p-8 rounded-3xl shadow-2xl border border-teal-200 dark:border-teal-700 transition-all duration-300 backdrop-blur-xl hover:shadow-3xl hover:scale-[1.01] hover:border-teal-400 dark:hover:border-teal-400">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-teal-900 dark:text-teal-200 drop-shadow-lg tracking-tight">
          {language === 'tc' ? '交通新聞' : 'Traffic News'}
        </h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => refetch()}
            className="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            aria-label="Refresh News"
          >
            <RefreshIcon className="w-5 h-5" />
          </button>
          <div className="flex rounded-lg bg-gradient-to-r from-teal-100 via-white to-teal-50 dark:from-gray-800 dark:via-gray-700 dark:to-gray-900 p-1 border border-teal-100 dark:border-teal-700">
            <button
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors min-w-[64px] ${
                language === 'tc'
                  ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-white'
                  : 'text-gray-700 dark:text-gray-300'
              }`}
              onClick={() => setLanguage('tc')}
            >
              中文
            </button>
            <button
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors min-w-[64px] ${
                language === 'en'
                  ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-white'
                  : 'text-gray-700 dark:text-gray-300'
              }`}
              onClick={() => setLanguage('en')}
            >
              ENG
            </button>
          </div>
        </div>
      </div>
      
      {/* Last Updated Timestamp */}
      {lastUpdated && !loading && (
        <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
          {language === 'tc' ? '最後更新於 ' : 'Last updated at '}
          {formatTime(lastUpdated)}
        </div>
      )}

      {loading && <Loader message={language === 'tc' ? "載入交通新聞..." : "Loading traffic news..."} />}
      {error && <ErrorDisplay message={error} />}
      
      {!loading && !error && (
        <div className="space-y-4 overflow-y-auto flex-grow">
          {news.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">
              {language === 'tc' ? '暫無交通新聞' : 'No traffic news available'}
            </p>
          ) : (
            news.map((item) => (
              <NewsCard
                key={item.id}
                item={item}
                isExpanded={expandedNews === item.id}
                onToggleExpand={toggleExpand}
                language={language}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default NewsPanel;