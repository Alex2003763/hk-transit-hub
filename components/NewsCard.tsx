import React from 'react';
import ChevronDownIcon from './icons/ChevronDownIcon';

interface NewsItem {
  id: string;
  title: string;
  content: string;
  date: string;
  status: string;
  location: string;
  landmark: string;
}

interface NewsCardProps {
  item: NewsItem;
  isExpanded: boolean;
  onToggleExpand: (id: string) => void;
  language: 'tc' | 'en';
  formatDate: (dateString: string) => string;
}

const NewsCard: React.FC<NewsCardProps> = ({ item, isExpanded, onToggleExpand, language, formatDate }) => {
  return (
    <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-sm overflow-hidden transition-all duration-300 ease-in-out hover:shadow-md border border-gray-100 dark:border-gray-700">
      <div
        className="p-4 cursor-pointer"
        onClick={() => onToggleExpand(item.id)}
        role="button"
        aria-expanded={isExpanded}
        aria-controls={`news-content-${item.id}`}
      >
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-base text-gray-900 dark:text-white">
            {item.title}
          </h3>
          <div className="flex items-center">
            <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap mr-3">
              {formatDate(item.date)}
            </span>
            <ChevronDownIcon
              className={`w-5 h-5 text-gray-500 dark:text-gray-400 transform transition-transform duration-300 ${
                isExpanded ? 'rotate-180' : ''
              }`}
            />
          </div>
        </div>
      </div>
      <div
        id={`news-content-${item.id}`}
        className={`transition-all duration-500 ease-in-out overflow-hidden ${
          isExpanded ? 'max-h-screen' : 'max-h-0'
        }`}
      >
        <div className="px-4 pb-4 space-y-3">
          <div className="border-t border-gray-200 dark:border-gray-700 pt-3"></div>
          <p className="text-sm text-gray-700 dark:text-gray-300">{item.content}</p>
          {item.location && <p className="text-sm text-gray-700 dark:text-gray-300"><strong>{language === 'tc' ? '位置：' : 'Location:'}</strong> {item.location}</p>}
          {item.landmark && <p className="text-sm text-gray-700 dark:text-gray-300"><strong>{language === 'tc' ? '附近地標：' : 'Near landmark:'}</strong> {item.landmark}</p>}
          {item.status && <p className="text-sm text-gray-700 dark:text-gray-300"><strong>{language === 'tc' ? '狀態：' : 'Status:'}</strong> {item.status}</p>}
        </div>
      </div>
    </div>
  );
};

export default NewsCard;