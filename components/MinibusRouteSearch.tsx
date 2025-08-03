import React, { useState, useMemo } from 'react';
import { MinibusRoute, MinibusHeadway } from '../types';
import MinibusIcon from './icons/MinibusIcon';

const REGIONS = ['HKI', 'KLN', 'NT'] as const;
type Region = typeof REGIONS[number];

const REGION_NAMES: Record<Region, string> = {
  'HKI': '香港島',
  'KLN': '九龍',
  'NT': '新界'
};

interface MinibusRouteSearchProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedRegion: Region | null;
  setSelectedRegion: (region: Region | null) => void;
  routes: MinibusRoute[];
  onSelectRoute: (route: MinibusRoute) => void;
}

const MinibusRouteSearch: React.FC<MinibusRouteSearchProps> = ({
  searchTerm,
  setSearchTerm,
  selectedRegion,
  setSelectedRegion,
  routes,
  onSelectRoute
}) => {
  return (
    <div className="space-y-4 pt-4">
      <div className="sticky top-[64px] z-10 bg-gray-50/80 dark:bg-gray-900/80 backdrop-blur-md -mx-4 px-4 py-3 border-b border-gray-200 dark:border-gray-800">
        {/* 搜索輸入框 */}
        <div className="relative mb-3">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="輸入路線號碼或目的地 (例如: 1, 銅鑼灣, Causeway Bay)"
            className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl py-3 px-5 pl-12 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)] transition-shadow"
          />
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* 區域過濾器 */}
        <div className="flex gap-2">
          {REGIONS.map(region => (
            <button
              key={region}
              onClick={() => setSelectedRegion(selectedRegion === region ? null : region)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
                ${selectedRegion === region 
                  ? 'bg-[color:var(--accent)] text-[color:var(--accent-text)]' 
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                } border border-gray-200 dark:border-gray-700`}
            >
              {REGION_NAMES[region]}
            </button>
          ))}
        </div>
      </div>

      {/* 路線列表 */}
      <ul className="space-y-3 animate-fade-in">
        {routes.map(route => (
          <li
            key={route.routeId}
            onClick={() => onSelectRoute(route)}
            className="bg-white dark:bg-gray-800 rounded-xl p-3 flex items-center justify-between cursor-pointer transition-all duration-200 shadow-sm hover:shadow-lg hover:scale-[1.02] border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center gap-4">
              <div className="flex gap-2 items-center">
                <div className="text-green-600 dark:text-green-500 group-hover:text-[color:var(--accent)] transition-colors">
                  <MinibusIcon className="w-10 h-10" />
                </div>
                <div className="bg-green-600 dark:bg-green-500 text-white font-bold rounded-lg w-14 h-10 flex items-center justify-center text-lg group-hover:bg-[color:var(--accent)] transition-colors">
                  {route.routeNo}
                </div>
              </div>
              <div className="overflow-hidden flex-1">
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white text-base truncate">
                    {route.orig_tc}
                  </div>
                  <div className="text-gray-500 dark:text-gray-400 text-sm flex items-center gap-1">
                    <span>往</span>
                    <span className="truncate">{route.dest_tc}</span>
                  </div>
                  {route.directions && route.directions[0]?.headways && (
                    <div className="mt-1 text-sm">
                      <FrequencyDisplay headways={route.directions[0].headways} />
                    </div>
                  )}
                </div>
              </div>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-300 dark:text-gray-500 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </li>
        ))}
        {routes.length === 0 && searchTerm && (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <p className="font-semibold">找不到路線 "{searchTerm}"</p>
            <p className="text-sm">請檢查搜尋內容。</p>
          </div>
        )}
      </ul>
    </div>
  );
};

// 獲取當前時段的班次信息
const getCurrentHeadway = (headways: MinibusHeadway[]): MinibusHeadway | null => {
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();
  const isPublicHoliday = false; // TODO: 實現公眾假期檢查
  const isWeekend = now.getDay() === 0;

  return headways.find(hw => {
    const [startHour, startMin] = hw.start_time.split(':').map(Number);
    const [endHour, endMin] = hw.end_time.split(':').map(Number);
    const startTimeMinutes = startHour * 60 + startMin;
    const endTimeMinutes = endHour * 60 + endMin;

    const isValidTime = currentTime >= startTimeMinutes && currentTime <= endTimeMinutes;
    const isValidDay = isPublicHoliday ? hw.public_holiday :
                      isWeekend ? hw.weekdays[6] :
                      hw.weekdays[now.getDay() - 1];

    return isValidTime && isValidDay;
  }) || null;
};

// 班次頻率顯示組件
const FrequencyDisplay: React.FC<{ headways: MinibusHeadway[] }> = ({ headways }) => {
  const currentHeadway = useMemo(() => getCurrentHeadway(headways), [headways]);

  if (!currentHeadway) {
    return null;
  }

  return (
    <div className="inline-flex items-center gap-1 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 px-2 py-0.5 rounded">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>
        {currentHeadway.frequency}
        {currentHeadway.frequency_upper ? `-${currentHeadway.frequency_upper}` : ''} 分鐘一班
      </span>
    </div>
  );
};

export default MinibusRouteSearch;