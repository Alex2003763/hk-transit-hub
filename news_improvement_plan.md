# 新聞頁面改善計畫

本文件旨在規劃新聞頁面的重構與功能改善。計畫分為以下幾個部分：

1.  **資料層重構 (`useNews` hook)**
2.  **快取機制整合**
3.  **UI/UX 改善 (`NewsPanel` & `NewsCard`)**

---

## 1. 資料層重構 (`useNews` hook)

為了讓元件邏輯更清晰，我們會將所有與新聞資料獲取、解析和狀態管理相關的邏輯抽離到一個新的 custom hook `useNews` 中。

**檔案位置:** `hooks/useNews.ts`

**`NewsItem` 介面 (維持不變):**

```typescript
export interface NewsItem {
  id: string;
  title: string;
  content: string;
  date: string;
  status: string;
  location: string;
  landmark: string;
}```

**`useNews` Hook 實作:**

這個 hook 會回傳新聞資料、載入狀態、錯誤訊息、最後更新時間，以及一個 `refetch` 函式。

```typescript
import { useState, useEffect, useCallback } from 'react';
import { cacheManager, CACHE_CONFIGS } from '../services/cacheManager';

// ... (NewsItem interface)

const NEWS_CACHE_KEY = 'traffic_news';

export const useNews = (language: 'tc' | 'en') => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchNews = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    const cacheKey = `${NEWS_CACHE_KEY}_${language}`;

    if (!forceRefresh) {
      const cachedData = cacheManager.get<{ items: NewsItem[], timestamp: Date }>(cacheKey);
      if (cachedData) {
        setNews(cachedData.items);
        setLastUpdated(cachedData.timestamp);
        setLoading(false);
        return;
      }
    }

    try {
      const response = await fetch(`https://www.td.gov.hk/${language}/special_news/trafficnews.xml?t=${new Date().getTime()}`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const xmlText = await response.text();
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
      
      if (xmlDoc.getElementsByTagName('parsererror').length > 0) {
        throw new Error('Invalid XML response from server');
      }
      
      const messages = xmlDoc.getElementsByTagName('message');
      const newsItems: NewsItem[] = Array.from(messages).map(msg => ({
        // ... (XML parsing logic from NewsPanel.tsx)
      }));
      
      const now = new Date();
      setNews(newsItems);
      setLastUpdated(now);
      cacheManager.set(cacheKey, { items: newsItems, timestamp: now }, CACHE_CONFIGS.NEWS);
      setError(null);
    } catch (err) {
      console.error('Error fetching news:', err);
      setError(`無法加載交通新聞: ${err instanceof Error ? err.message : '未知錯誤'}. 請稍后再试。`);
    } finally {
      setLoading(false);
    }
  }, [language]);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  const refetch = () => fetchNews(true);

  return { news, loading, error, lastUpdated, refetch };
};
```

---

## 2. 快取機制整合

我們會在 `services/cacheManager.ts` 中為新聞資料新增一個快取設定。

**檔案位置:** `services/cacheManager.ts`

在 `CACHE_CONFIGS` 物件中新增 `NEWS` 設定：

```typescript
export const CACHE_CONFIGS = {
  ROUTES: { maxAge: 30 * 60 * 1000, maxSize: 50 }, // 30 minutes
  STOPS: { maxAge: 60 * 60 * 1000, maxSize: 200 }, // 1 hour
  ROUTE_STOPS: { maxAge: 15 * 60 * 1000, maxSize: 100 }, // 15 minutes
  ETA: { maxAge: 30 * 1000, maxSize: 500 }, // 30 seconds
  NEWS: { maxAge: 5 * 60 * 1000, maxSize: 10 }, // 5 minutes for news
} as const;
```

---

## 3. UI/UX 改善

### `NewsPanel.tsx`

此元件將會使用 `useNews` hook，並簡化其 UI。版面將從網格改為單欄列表。

```typescript
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

  const formatDate = (date: Date | null) => {
    if (!date) return '';
    return date.toLocaleString(language === 'tc' ? 'zh-HK' : 'en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900 p-4">
      {/* Header with language toggle and refresh button */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          {language === 'tc' ? '交通新聞' : 'Traffic News'}
        </h2>
        {/* ... (Language toggle and refresh button JSX) ... */}
      </div>
      
      {/* Last Updated Timestamp */}
      {lastUpdated && !loading && (
        <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
          {language === 'tc' ? '最後更新於 ' : 'Last updated at '}
          {formatDate(lastUpdated)}
        </div>
      )}

      {/* Content */}
      {loading && <Loader message={language === 'tc' ? "載入交通新聞..." : "Loading traffic news..."} />}
      {error && <ErrorDisplay message={error} />}
      {!loading && !error && (
        <div className="space-y-4 overflow-y-auto flex-grow">
          {news.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400">
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
```

### `NewsCard.tsx`

卡片設計將會更新，加入狀態標籤，並調整版面以提升可讀性。

```typescript
import React from 'react';
import ChevronDownIcon from './icons/ChevronDownIcon';

// ... (NewsItem interface)

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
    // ... (formatDate logic from NewsPanel)
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="p-4 cursor-pointer" onClick={() => onToggleExpand(item.id)}>
        <div className="flex justify-between items-start gap-4">
          <div className="flex-grow">
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusBadgeColor(item.status)}`}>
                {item.status}
              </span>
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white">{item.title}</h3>
          </div>
          <div className="flex-shrink-0 flex flex-col items-end">
            <span className="text-xs text-gray-500 dark:text-gray-400 mb-2">{formatDate(item.date)}</span>
            <ChevronDownIcon className={`w-5 h-5 text-gray-500 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </div>
        </div>
      </div>
      <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isExpanded ? 'max-h-screen' : 'max-h-0'}`}>
        <div className="px-4 pb-4 border-t border-gray-200 dark:border-gray-700 pt-3">
          <p className="text-sm text-gray-700 dark:text-gray-300">{item.content}</p>
          {/* ... (Location and Landmark details) ... */}
        </div>
      </div>
    </div>
  );
};

export default NewsCard;
```

---

下一步是請求使用者切換到「程式碼」模式，並根據這份計畫文件來實作程式碼的變更。