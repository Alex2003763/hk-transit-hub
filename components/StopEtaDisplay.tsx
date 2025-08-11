import React, { useEffect, useState, useRef } from 'react';
import ReactDOM from 'react-dom';
import { Eta, MinibusEta } from '../types';
import { requestNotificationPermission, showNotification } from '../services/notificationService';

interface StopEtaDisplayProps {
  etas: (Eta | MinibusEta)[];
  onRefresh: () => void;
  refreshInterval?: number;
  stopId?: string;
  routeId?: string;
}

interface Alarm {
  routeId: string;
  stopId: string;
  etaTime: string;
  notifyMinutes: number;
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
  
  if (!isSameDay(now, etaTime)) {
    const diffMs = etaTime.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return { diff: 0, unit: 'Expired', isPast: true };
    }
    else if (diffDays === 1) {
      return { diff: 0, unit: 'Tomorrow', isPast: false };
    }
    else if (diffDays > 1 && diffDays <= 7) {
      return { diff: 0, unit: `${diffDays} days`, isPast: false };
    }
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

const StopEtaDisplay: React.FC<StopEtaDisplayProps> = ({ etas, onRefresh, refreshInterval, stopId, routeId: propRouteId }) => {
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [showAlarmMenu, setShowAlarmMenu] = useState<number | null>(null);
  const buttonRefs = useRef<Array<React.RefObject<HTMLButtonElement>>>([]);

  useEffect(() => {
    const alarmList = JSON.parse(localStorage.getItem('busAlarms') || '[]') as Alarm[];
    setAlarms(alarmList);
  }, []);

  useEffect(() => {
    if (!etas || etas.length === 0) return;
    
    const interval = refreshInterval || 30000;
    const timer = setInterval(() => {
      onRefresh();
    }, interval);

    return () => clearInterval(timer);
  }, [etas, onRefresh, refreshInterval]);

  useEffect(() => {
    const checkAlarms = () => {
      const now = new Date();
      const alarmList = JSON.parse(localStorage.getItem('busAlarms') || '[]') as Alarm[];
      
      alarmList.forEach(alarm => {
        const etaTime = new Date(alarm.etaTime);
        const notifyTime = new Date(etaTime.getTime() - alarm.notifyMinutes * 60000);
        
        if (now >= notifyTime && now < etaTime) {
          const routeInfo = 'route' in etas ? `路線 ${alarm.routeId}` : `小巴 ${alarm.routeId}`;
          showNotification('巴士即將到站', {
            body: `${routeInfo} 將於 ${alarm.notifyMinutes} 分鐘後到達`,
            icon: '/icon.png'
          });
          
          const updatedAlarms = alarmList.filter(a => a.etaTime !== alarm.etaTime);
          localStorage.setItem('busAlarms', JSON.stringify(updatedAlarms));
          setAlarms(updatedAlarms);
        }
      });
    };

    const alarmInterval = setInterval(checkAlarms, 60000);
    return () => clearInterval(alarmInterval);
  }, [etas]);

  const handleAlarmClick = async (index: number) => {
    const hasPermission = await requestNotificationPermission();
    if (hasPermission) {
      setShowAlarmMenu(showAlarmMenu === index ? null : index);
    } else {
      alert('請允許通知權限以設定鬧鐘。');
    }
  };

  const setAlarm = (eta: Eta | MinibusEta, minutes: number) => {
    if (!eta.eta) {
      console.log('ETA is null or undefined');
      return;
    }

    let finalRouteId: string = propRouteId || '';
    if (!finalRouteId && 'route' in eta) {
      finalRouteId = (eta as Eta).route;
    }

    let actualStopId: string = stopId || '';
    if (!actualStopId && 'stop' in eta) {
      actualStopId = (eta as Eta).stop;
    }
    
    if (!finalRouteId || !actualStopId) {
      console.error('Missing routeId or stopId for alarm', { finalRouteId, actualStopId });
      return;
    }

    const newAlarm: Alarm = {
      routeId: finalRouteId,
      stopId: actualStopId,
      etaTime: eta.eta,
      notifyMinutes: minutes
    };

    const alarmList = JSON.parse(localStorage.getItem('busAlarms') || '[]') as Alarm[];
    const updatedAlarms = [...alarmList.filter(a => a.etaTime !== eta.eta), newAlarm];
    
    localStorage.setItem('busAlarms', JSON.stringify(updatedAlarms));
    setAlarms(updatedAlarms);
    setShowAlarmMenu(null);
  };

  const removeAlarm = (etaTime: string) => {
    const alarmList = JSON.parse(localStorage.getItem('busAlarms') || '[]') as Alarm[];
    const updatedAlarms = alarmList.filter(alarm => alarm.etaTime !== etaTime);
    localStorage.setItem('busAlarms', JSON.stringify(updatedAlarms));
    setAlarms(updatedAlarms);
    setShowAlarmMenu(null);
  };

  const isAlarmSet = (etaTime: string): boolean => {
    return alarms.some(alarm => alarm.etaTime === etaTime);
  };

  if (!etas || etas.length === 0) {
    return <div className="text-gray-500 dark:text-gray-400 py-6 text-center text-sm">No ETA information available. The service may have ended.</div>;
  }

  const sortedEtas = [...etas].sort((a, b) => {
    if ('eta_seq' in a && 'eta_seq' in b) {
      return a.eta_seq - b.eta_seq;
    }
    return 0;
  });
  const stripParentheses = (text: string) => text.replace(/\s*\([^)]*\)\s*/g, '').trim();

  return (
    <div className="space-y-4 pt-2">
      {sortedEtas.map((eta, index) => {
        const timeDiff = calculateMinutesUntil(eta.eta);
        const remark = 'rmk_tc' in eta ?
          eta.rmk_tc.replace('原定班次', 'Scheduled') :
          ('remark_tc' in eta ? eta.remark_tc : '');

        const destName = 'dest_tc' in eta ? eta.dest_tc : '';
        const isSet = eta.eta ? isAlarmSet(eta.eta) : false;
        
        return (
          <div
            key={index}
            className={`relative flex items-center justify-between bg-gradient-to-br from-teal-50/80 via-white/70 to-teal-100/80 dark:from-gray-900/80 dark:via-gray-800/70 dark:to-gray-900/80 p-4 rounded-2xl shadow-xl border border-teal-200 dark:border-teal-700 transition-all duration-300 hover:shadow-3xl hover:border-teal-400 dark:hover:border-teal-400 ${showAlarmMenu === index ? 'z-30' : ''}`}
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
            
            <div className="relative">
              <button
                ref={el => {
                  if (!buttonRefs.current[index]) {
                    buttonRefs.current[index] = React.createRef();
                  }
                  if (buttonRefs.current[index].current !== el) {
                    buttonRefs.current[index].current = el;
                  }
                }}
                onClick={() => handleAlarmClick(index)}
                className="p-2 rounded-full hover:bg-teal-100 dark:hover:bg-gray-700 transition-colors"
                aria-label={isSet ? "取消鬧鐘" : "設定鬧鐘"}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${isSet ? 'text-teal-600 dark:text-teal-400' : 'text-gray-500 dark:text-gray-400'}`} viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
              </button>
              
              {showAlarmMenu === index && buttonRefs.current[index]?.current &&
                ReactDOM.createPortal(
                  <div
                    className="absolute w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-[100] border border-gray-200 dark:border-gray-700"
                    style={{
                      top: buttonRefs.current[index].current!.getBoundingClientRect().bottom + window.scrollY,
                      left: buttonRefs.current[index].current!.getBoundingClientRect().left + window.scrollX,
                      pointerEvents: 'auto'
                    }}
                  >
                    {/* Alarm dropdown rendered */}
                    <div className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 font-medium">提前通知</div>
                    {[3, 5, 10].map(minutes => {
                      console.log('提前通知選項:', minutes);
                      return (
                        <button
                          key={minutes}
                          onClick={() => setAlarm(eta, minutes)}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-teal-100 dark:hover:bg-gray-700"
                        >
                          {minutes} 分鐘
                        </button>
                      );
                    })}
                    {isSet && (
                      <button
                        onClick={() => eta.eta && removeAlarm(eta.eta)}
                        className="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50"
                      >
                        取消鬧鐘
                      </button>
                    )}
                  </div>,
                  document.body
                )
              }
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default StopEtaDisplay;