import React from 'react';
import ChevronDownIcon from './icons/ChevronDownIcon';
import NewsIcon from './icons/NewsIcon';
import { FaMapMarkerAlt, FaLandmark, FaLink } from 'react-icons/fa';

interface NewsItem {
  id: string;
  title: string;
  content: string;
  date: string;
  status: string;
  location: string;
  landmark: string;
  source?: string; // 新增來源欄位
  category?: string; // 新增分類欄位
  link?: string; // 新增連結欄位
}

interface NewsCardProps {
  item: NewsItem;
  isExpanded: boolean;
  onToggleExpand: (id: string) => void;
  language: 'tc' | 'en';
}

// Helper to determine badge color based on status
const getStatusBadgeColor = (status: string) => {
  if (status.includes('最新消息') || status.toLowerCase().includes('latest')) {
    return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
  }
  if (status.includes('完成') || status.toLowerCase().includes('completed')) {
    return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
  }
  return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
};

const NewsCard: React.FC<NewsCardProps> = ({ item, isExpanded, onToggleExpand, language }) => {
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

  // 新增分類圖示
  const renderCategoryIcon = (category?: string) => {
    if (!category) return <NewsIcon className="w-5 h-5 text-blue-400 mr-1" />;
    switch (category) {
      case '突發':
      case 'Breaking':
        return <NewsIcon className="w-5 h-5 text-red-500 mr-1" />;
      case '施工':
      case 'Construction':
        return <NewsIcon className="w-5 h-5 text-yellow-500 mr-1" />;
      case '恢復':
      case 'Recovery':
        return <NewsIcon className="w-5 h-5 text-green-500 mr-1" />;
      default:
        return <NewsIcon className="w-5 h-5 text-blue-400 mr-1" />;
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="p-4 cursor-pointer" onClick={() => onToggleExpand(item.id)}>
        <div className="flex justify-between items-start gap-4">
          <div className="flex-grow">
            <div className="flex items-center gap-2 mb-2">
              {renderCategoryIcon(item.category)}
              <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${getStatusBadgeColor(item.status)}`}>
                {item.status}
              </span>
            </div>
            <h3 className="font-semibold text-lg text-gray-900 dark:text-white">{item.title}</h3>
            {item.source && (
              <span className="text-xs text-gray-400 dark:text-gray-500 ml-1">
                {language === 'tc' ? `來源：${item.source}` : `Source: ${item.source}`}
              </span>
            )}
          </div>
          <div className="flex-shrink-0 flex flex-col items-end">
            <span className="text-xs text-gray-500 dark:text-gray-400 mb-2">{formatDate(item.date)}</span>
            <ChevronDownIcon className={`w-5 h-5 text-gray-500 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </div>
        </div>
      </div>
      <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isExpanded ? 'max-h-screen' : 'max-h-0'}`}>
        <div className="px-4 pb-4 border-t border-gray-200 dark:border-gray-700 pt-3">
          <p className="text-base text-gray-700 dark:text-gray-300 break-words" style={{overflowWrap: 'anywhere', wordBreak: 'break-word', maxWidth: '100%'}}>
            {item.content}
          </p>
          <div className="flex flex-wrap gap-3 mt-3">
            {item.location && (
              <span className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                <FaMapMarkerAlt className="mr-1 text-red-400" />
                <strong>{language === 'tc' ? '位置：' : 'Location:'}</strong> {item.location}
              </span>
            )}
            {item.landmark && (
              <span className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                <FaLandmark className="mr-1 text-yellow-500" />
                <strong>{language === 'tc' ? '附近地標：' : 'Near landmark:'}</strong> {item.landmark}
              </span>
            )}
            {item.link && (
              <a
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center text-sm text-blue-600 dark:text-blue-400 underline"
              >
                <FaLink className="mr-1" />
                {language === 'tc' ? '詳細內容' : 'Details'}
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewsCard;