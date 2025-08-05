import { useState, useEffect, useCallback } from 'react';
import { cacheManager, CACHE_CONFIGS } from '../services/cacheManager';

export interface NewsItem {
  id: string;
  title: string;
  content: string;
  date: string;
  status: string;
  location: string;
  landmark: string;
}

const NEWS_CACHE_KEY = 'traffic_news';

export const useNews = (language: 'tc' | 'en') => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchNews = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    const cacheKey = `${NEWS_CACHE_KEY}_${language}`;

    // 檢查快取是否存在有效資料
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
      
      // 檢查 XML 解析錯誤
      if (xmlDoc.getElementsByTagName('parsererror').length > 0) {
        throw new Error('Invalid XML response from server');
      }
      
      // 解析 XML 資料
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
      
      // 更新狀態並設置快取
      const now = new Date();
      setNews(newsItems);
      setLastUpdated(now);
      cacheManager.set(cacheKey, { items: newsItems, timestamp: now }, CACHE_CONFIGS.NEWS);
      setError(null);
    } catch (err) {
      console.error('Error fetching news:', err);
      setError(`無法加載交通新聞: ${err instanceof Error ? err.message : '未知錯誤'}. 請稍後再試。`);
    } finally {
      setLoading(false);
    }
  }, [language]);

  // 初始化載入資料
  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  // 強制重新整理函式
  const refetch = () => fetchNews(true);

  return { news, loading, error, lastUpdated, refetch };
};