import React from 'react';
import { Eta } from '../types';

interface StopEtaDisplayProps {
  etas: Eta[];
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
  if (!etas || etas.length === 0) {
    return <div className="text-gray-500 dark:text-gray-400 py-6 text-center text-sm">No ETA information available. The service may have ended.</div>;
  }

  const sortedEtas = [...etas].sort((a, b) => a.eta_seq - b.eta_seq);
  const stripParentheses = (text: string) => text.replace(/\s*\([^)]*\)\s*/g, '').trim();

  return (
    <div className="space-y-2 pt-2">
      {sortedEtas.map((eta, index) => {
        const timeDiff = calculateMinutesUntil(eta.eta);
        const remark = eta.rmk_tc.replace('原定班次', 'Scheduled');
        
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
                  <p className="text-gray-900 dark:text-white font-semibold">To: {stripParentheses(eta.dest_tc)}</p>
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