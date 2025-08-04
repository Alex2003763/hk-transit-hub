import React, { useState, useEffect, useCallback } from 'react';
import Loader from './Loader';
import ErrorDisplay from './ErrorDisplay';
import WeatherDisplay from './WeatherDisplay';
import NewsCard from './NewsCard';
import RefreshIcon from './icons/RefreshIcon';

interface NewsItem {
  id: string;
  title: string;
  content: string;
  date: string;
  status: string;
  location: string;
  landmark: string;
}

const NewsPanel: React.FC = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [language, setLanguage] = useState<'tc' | 'en'>('tc');
  const [expandedNews, setExpandedNews] = useState<string | null>(null);

  const fetchNews = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`https://www.td.gov.hk/${language}/special_news/trafficnews.xml?t=${new Date().getTime()}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const xmlText = await response.text();
      
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
      
      const parserError = xmlDoc.getElementsByTagName('parsererror');
      if (parserError.length > 0) {
        throw new Error('Invalid XML response from server');
      }
      
      const messages = xmlDoc.getElementsByTagName('message');
      const newsItems: NewsItem[] = Array.from(messages).map(msg => ({
        id: msg.getElementsByTagName('ID')[0]?.textContent || '',
        title: language === 'tc'
          ? (msg.getElementsByTagName('INCIDENT_HEADING_CN')[0]?.textContent || '')
          : (msg.getElementsByTagName('INCIDENT_HEADING_EN')[0]?.textContent || ''),
        content: language === 'tc'
          ? (msg.getElementsByTagName('CONTENT_CN')[0]?.textContent || '')
          : (msg.getElementsByTagName('CONTENT_EN')[0]?.textContent || ''),
        date: msg.getElementsByTagName('ANNOUNCEMENT_DATE')[0]?.textContent || '',
        status: language === 'tc'
          ? (msg.getElementsByTagName('INCIDENT_STATUS_CN')[0]?.textContent || '')
          : (msg.getElementsByTagName('INCIDENT_STATUS_EN')[0]?.textContent || ''),
        location: language === 'tc'
          ? (msg.getElementsByTagName('LOCATION_CN')[0]?.textContent || '')
          : (msg.getElementsByTagName('LOCATION_EN')[0]?.textContent || ''),
        landmark: language === 'tc'
          ? (msg.getElementsByTagName('NEAR_LANDMARK_CN')[0]?.textContent || '')
          : (msg.getElementsByTagName('NEAR_LANDMARK_EN')[0]?.textContent || ''),
      }));
      
      setNews(newsItems);
      setError(null);
    } catch (err) {
      console.error('Error fetching news:', err);
      setError(`无法加载交通新闻: ${err instanceof Error ? err.message : '未知错误'}. 请稍后再试。`);
    } finally {
      setLoading(false);
    }
  }, [language]);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  const toggleExpand = (id: string) => {
    setExpandedNews(expandedNews === id ? null : id);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        return date.toLocaleString(language === 'tc' ? 'zh-HK' : 'en-GB', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        });
      }
      return dateString;
    } catch (e) {
      return dateString;
    }
  };

  const handleRefresh = () => {
    fetchNews();
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900 p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          {language === 'tc' ? '交通新聞' : 'Traffic News'}
        </h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleRefresh}
            className="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            aria-label="Refresh News"
          >
            <RefreshIcon className="w-5 h-5" />
          </button>
          <div className="flex rounded-lg bg-gray-200 dark:bg-gray-700 p-1">
            <button
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                language === 'tc'
                  ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-white'
                  : 'text-gray-700 dark:text-gray-300'
              }`}
              onClick={() => setLanguage('tc')}
            >
              中文
            </button>
            <button
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
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

      {loading && <Loader message={language === 'tc' ? "載入交通新聞..." : "Loading traffic news..."} />}
      {error && <ErrorDisplay message={error} />}

      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto flex-grow">
          {news.length === 0 ? (
            <div className="text-center py-8 col-span-full">
              <p className="text-gray-500 dark:text-gray-400">
                {language === 'tc' ? '暫無交通新聞' : 'No traffic news available'}
              </p>
            </div>
          ) : (
            news.map((item) => (
              <NewsCard
                key={item.id}
                item={item}
                isExpanded={expandedNews === item.id}
                onToggleExpand={toggleExpand}
                language={language}
                formatDate={formatDate}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default NewsPanel;