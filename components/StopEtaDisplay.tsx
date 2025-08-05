import React, { useEffect } from 'react';
import { Eta, MinibusEta } from '../types';

interface StopEtaDisplayProps {
  etas: (Eta | MinibusEta)[];
  onRefresh: () => void; // 新增刷新回调函数
  refreshInterval?: number; // 刷新间隔（毫秒），可选，默认30000
}

const isSameDay = (date1: Date, date2: Date): boolean => {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
};

const calculateMinutesUntil = (etaTimestamp: string | null): { diff: number; unit: string; isPast: boolean } | null => {
  if (!etaTimestamp) return null;
  const now = new Date();
  const etaTime = new Date(etaTimestamp);
  
  // Handle cross-day scenarios
  if (!isSameDay(now, etaTime)) {
    const diffMs = etaTime.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    
    // 如果是过去的时间
    if (diffDays < 0) {
      return { diff: 0, unit: 'Expired', isPast: true };
    }
    // 如果是明天
    else if (diffDays === 1) {
      return { diff: 0, unit: 'Tomorrow', isPast: false };
    }
    // 如果是未来几天
    else if (diffDays > 1 && diffDays <= 7) {
      return { diff: 0, unit: `${diffDays} days`, isPast: false };
    }
    // 如果超过一周
    else if (diffDays > 7) {
      return { diff: 0, unit: 'Next week', isPast: false };
    }
  }
  
  const diffMs = etaTime.getTime() - now.getTime();
  const diffMins = Math.round(diffMs / 60000);
  
  if (diffMins < 1) {
    return { diff: 0, unit: 'Arriving', isPast: diffMins < 0 };
  }
  return { diff: diffMins, unit: 'min', isPast: false };
};

const StopEtaDisplay: React.FC<StopEtaDisplayProps> = ({ etas, onRefresh, refreshInterval }) => {
  // 自动刷新逻辑
  useEffect(() => {
    if (!etas || etas.length === 0) return;
    
    const interval = refreshInterval || 30000; // 默认30秒刷新间隔
    const timer = setInterval(() => {
      onRefresh(); // 调用父组件传递的刷新函数
    }, interval);

    return () => clearInterval(timer);
  }, [etas, onRefresh, refreshInterval]);

  if (!etas || etas.length === 0) {
    return <div className="text-gray-500 dark:text-gray-400 py-6 text-center text-sm">No ETA information available. The service may have ended.</div>;
  }

  const sortedEtas = [...etas].sort((a, b) => {
    if ('eta_seq' in a && 'eta_seq' in b) {
      return a.eta_seq - b.eta_seq;
    }
    // For MinibusEta, maintain original order
    return 0;
  });
  const stripParentheses = (text: string) => text.replace(/\s*\([^)]*\)\s*/g, '').trim();

  return (
    <div className="space-y-4 pt-2">
      {sortedEtas.map((eta, index) => {
        const timeDiff = calculateMinutesUntil(eta.eta);
        const remark = ('rmk_tc' in eta) ?
          eta.rmk_tc.replace('原定班次', 'Scheduled') :
          ('remark_tc' in eta ? eta.remark_tc : '');

        const destName = ('dest_tc' in eta) ? eta.dest_tc : '';
        
        return (
          <div
            key={index}
            className="flex items-center justify-between bg-gradient-to-br from-teal-50/80 via-white/70 to-teal-100/80 dark:from-gray-900/80 dark:via-gray-800/70 dark:to-gray-900/80 p-4 rounded-2xl shadow-xl border border-teal-200 dark:border-teal-700 transition-all duration-300 backdrop-blur-md hover:shadow-3xl hover:scale-105 hover:border-teal-400 dark:hover:border-teal-400"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0 w-14 text-center">
                {timeDiff ? (
                  <div className={`text-3xl font-extrabold ${timeDiff.isPast ? 'text-red-500' : 'text-teal-600 dark:text-[color:var(--accent)]'}`}>
                    {timeDiff.diff > 0 ? `${timeDiff.diff}` : <span className="text-lg">Now</span>}
                  </div>
                ) : (
                  <div className="text-2xl font-bold text-gray-500 dark:text-gray-400">-</div>
                )}
                {timeDiff?.diff > 0 && <div className="text-xs text-gray-500 dark:text-gray-400">min</div>}
              </div>

              <div className="border-l border-gray-200 dark:border-gray-600 ml-4 pl-4">
                <p className="text-gray-900 dark:text-white font-extrabold text-lg sm:text-xl drop-shadow">
                  {destName ? `To: ${stripParentheses(destName)}` : ''}
                </p>
                {remark && <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">{remark}</p>}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default StopEtaDisplay;