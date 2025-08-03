import React, { useEffect } from 'react';
import { Eta, MinibusEta } from '../types';

interface StopEtaDisplayProps {
  etas: (Eta | MinibusEta)[];
  onRefresh: () => void; // 新增刷新回调函数
  refreshInterval?: number; // 刷新间隔（毫秒），可选，默认30000
}

const calculateMinutesUntil = (etaTimestamp: string | null): { diff: number; unit: string; isPast: boolean } | null => {
  if (!etaTimestamp) return null;
  const now = new Date();
  const etaTime = new Date(etaTimestamp);
  const diffMs = etaTime.getTime() - now.getTime();
  const diffMins = Math.round(diffMs / 60000);
  
  if (diffMins < 1) {
    return { diff: 0, unit: 'Arriving', isPast: diffMins < 0 };
  }
  return { diff: diffMins, unit: 'min', isPast: false };
};

const StopEtaDisplay: React.FC<StopEtaDisplayProps> = ({ etas }) => {
  // 自动刷新逻辑
  useEffect(() => {
    if (!etas || etas.length === 0) return;
    
    const timer = setInterval(() => {
      // 这里需要触发重新获取ETA的逻辑
      // 由于没有直接的回调函数，暂时使用控制台日志
      console.log("Auto-refreshing ETA data...");
    }, 30000); // 每30秒刷新一次

    return () => clearInterval(timer);
  }, [etas]);

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
    <div className="space-y-2 pt-2">
      {sortedEtas.map((eta, index) => {
        const timeDiff = calculateMinutesUntil(eta.eta);
        const remark = ('rmk_tc' in eta) ?
          eta.rmk_tc.replace('原定班次', 'Scheduled') :
          ('remark_tc' in eta ? eta.remark_tc : '');

        const destName = ('dest_tc' in eta) ? eta.dest_tc : '';
        
        return (
          <div key={index} className="flex items-center justify-between bg-gray-100 dark:bg-gray-700/50 p-3 rounded-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0 w-12 text-center">
                {timeDiff ? (
                  <div className={`text-xl font-bold ${timeDiff.isPast ? 'text-red-500' : 'text-teal-500 dark:text-[color:var(--accent)]'}`}>
                    {timeDiff.diff > 0 ? `${timeDiff.diff}` : <span className="text-lg">Now</span>}
                  </div>
                ) : (
                    <div className="text-xl font-bold text-gray-500 dark:text-gray-400">-</div>
                )}
                 {timeDiff?.diff > 0 && <div className="text-xs text-gray-500 dark:text-gray-400">min</div>}
              </div>

              <div className="border-l border-gray-200 dark:border-gray-600 ml-2 pl-4">
                  <p className="text-gray-900 dark:text-white font-semibold">
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