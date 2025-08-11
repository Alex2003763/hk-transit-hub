import React, { useState, useEffect } from 'react';

interface Alarm {
  routeId: string;
  stopId: string;
  etaTime: string;
  notifyMinutes: number;
}

interface AlarmPanelProps {
  onBack: () => void;
}

const AlarmPanel: React.FC<AlarmPanelProps> = ({ onBack }) => {
  const [alarms, setAlarms] = useState<Alarm[]>([]);

  useEffect(() => {
    const alarmList = JSON.parse(localStorage.getItem('busAlarms') || '[]') as Alarm[];
    setAlarms(alarmList);
  }, []);

  const removeAlarm = (etaTime: string) => {
    const updatedAlarms = alarms.filter(alarm => alarm.etaTime !== etaTime);
    localStorage.setItem('busAlarms', JSON.stringify(updatedAlarms));
    setAlarms(updatedAlarms);
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center flex-shrink-0">
        <button
          onClick={onBack}
          className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          aria-label="返回"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="flex-1 text-center text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
          管理鬧鐘
        </h2>
        <div className="w-10"></div> {/* Placeholder for spacing */}
      </div>

      {/* Alarms List */}
      <div className="flex-grow overflow-y-auto space-y-4">
        {alarms.length > 0 ? (
          alarms.map((alarm, index) => (
            <div key={index} className="flex items-center bg-gradient-to-br from-white to-gray-100 dark:from-gray-800 dark:to-gray-800/50 p-4 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 transition-all hover:shadow-xl hover:border-teal-400 dark:hover:border-teal-500">
              <div className="flex-shrink-0 pr-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-teal-500 dark:text-teal-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-grow">
                <p className="font-bold text-lg text-gray-800 dark:text-white">路線: {alarm.routeId}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  將於到站前 <span className="font-semibold text-teal-600 dark:text-teal-400">{alarm.notifyMinutes}</span> 分鐘通知
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 pt-1">
                  預計到站: {new Date(alarm.etaTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <button
                onClick={() => removeAlarm(alarm.etaTime)}
                className="p-2 rounded-full text-gray-400 hover:bg-red-100 hover:text-red-500 dark:hover:bg-red-900/50 dark:hover:text-red-400 transition-colors"
                aria-label="刪除鬧鐘"
                title="刪除鬧鐘"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 dark:text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-lg font-semibold">沒有已設定的鬧鐘</p>
            <p className="text-sm">你可以在到站時間顯示中設定鬧鐘。</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AlarmPanel;
