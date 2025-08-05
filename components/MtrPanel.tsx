import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { getMtrSchedule } from '../services/mtrApi';
import { MtrScheduleResponse, MtrTrainArrival, MtrDirection } from '../types';
import { mtrLines, mtrStations, getStationName, getLineName, MtrStation } from '../data/mtrStations';
import Loader from './Loader';
import ErrorDisplay from './ErrorDisplay';

type Direction = 'UP' | 'DOWN';

const MtrPanel: React.FC = () => {
    const [selectedLine, setSelectedLine] = useState<string>('');
    const [selectedStation, setSelectedStation] = useState<string>('');
    const [stationSearchTerm, setStationSearchTerm] = useState('');
    const [schedule, setSchedule] = useState<MtrScheduleResponse | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [isStationListVisible, setIsStationListVisible] = useState(false);
    const [activeDirection, setActiveDirection] = useState<Direction | null>(null);
    const [directionNames, setDirectionNames] = useState<{ UP: string; DOWN: string }>({ UP: '', DOWN: '' });
    const stationInputContainerRef = useRef<HTMLDivElement>(null);

    const stripParentheses = (text: string) => text ? text.replace(/\s*\([^)]*\)\s*/g, '').trim() : '';

    const getDirectionDestinations = useCallback((arrivals: MtrTrainArrival[] | undefined): string => {
        if (!arrivals || arrivals.length === 0) return '';
        
        const uniqueDestinations = [...new Set(arrivals.map(train => train.dest))];
        return uniqueDestinations
            .map(destCode => stripParentheses(getStationName(selectedLine, destCode, 'tc')))
            .join(' / ');
    }, [selectedLine]);


    const filteredStations = useMemo(() => {
        if (!selectedLine) return [];
        const stations = mtrStations[selectedLine] || [];
        if (!stationSearchTerm.trim() || (selectedStation && stationSearchTerm === stripParentheses(getStationName(selectedLine, selectedStation, 'tc')))) {
            return stations;
        }
        
        const lowercasedFilter = stationSearchTerm.toLowerCase();
        return stations.filter(station =>
            stripParentheses(station.name_tc).toLowerCase().includes(lowercasedFilter) ||
            stripParentheses(station.name_en).toLowerCase().includes(lowercasedFilter) ||
            station.code.toLowerCase().includes(lowercasedFilter)
        );
    }, [selectedLine, stationSearchTerm, selectedStation]);

    useEffect(() => {
        setSelectedStation('');
        setStationSearchTerm('');
        setSchedule(null);
        setActiveDirection(null);
    }, [selectedLine]);

    useEffect(() => {
        if (!selectedLine || !selectedStation) {
            setSchedule(null);
            setActiveDirection(null);
            return;
        }

        const fetchSchedule = async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await getMtrSchedule(selectedLine, selectedStation);
                if (data.status === 0) {
                   setError(data.message || 'This station is currently not in service.');
                   setSchedule(null);
                } else {
                   setSchedule(data);
                   const dataKey = `${selectedLine}-${selectedStation}`;
                   const stationData = data.data?.[dataKey] as MtrDirection | undefined;
                   
                   const upName = getDirectionDestinations(stationData?.UP);
                   const downName = getDirectionDestinations(stationData?.DOWN);
                   setDirectionNames({ UP: upName, DOWN: downName });

                   if (stationData?.UP && stationData.UP.length > 0) {
                       setActiveDirection('UP');
                   } else if (stationData?.DOWN && stationData.DOWN.length > 0) {
                       setActiveDirection('DOWN');
                   } else {
                       setActiveDirection(null);
                   }
                }
            } catch (err) {
                setError('Failed to fetch MTR schedule. The service may be temporarily unavailable.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchSchedule();
    }, [selectedLine, selectedStation, getDirectionDestinations]);

    const handleClickOutside = useCallback((event: MouseEvent) => {
        if (stationInputContainerRef.current && !stationInputContainerRef.current.contains(event.target as Node)) {
            setIsStationListVisible(false);
        }
    }, []);

    useEffect(() => {
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [handleClickOutside]);
    
    const handleStationSelect = (station: MtrStation) => {
        setSelectedStation(station.code);
        setStationSearchTerm(stripParentheses(station.name_tc));
        setIsStationListVisible(false);
    };
    
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newSearchTerm = e.target.value;
        setStationSearchTerm(newSearchTerm);
        if (selectedStation && newSearchTerm !== stripParentheses(getStationName(selectedLine, selectedStation, 'tc'))) {
            setSelectedStation('');
        }
        if (!isStationListVisible) {
            setIsStationListVisible(true);
        }
    }

    const dataKey = `${selectedLine}-${selectedStation}`;
    const stationData = schedule?.data?.[dataKey] as MtrDirection | undefined;

    const renderArrivals = (arrivals: MtrTrainArrival[] | undefined) => {
        if (!arrivals || arrivals.length === 0) {
            return <p className="text-gray-500 dark:text-gray-400 text-center py-6 text-sm">No upcoming trains for this direction.</p>;
        }
        
        return (
            <div className="space-y-3 p-1">
                {arrivals.map((train) => (
                    <div key={train.seq} className="flex items-center justify-between bg-white dark:bg-gray-800 p-3 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-4">
                            <div className="w-16 text-center flex-shrink-0">
                                <span className="font-semibold text-gray-500 dark:text-gray-400 block text-sm">Platform</span>
                                <span className="text-2xl font-bold text-[color:var(--accent)] block">{train.plat}</span>
                            </div>
                            <div className="border-l border-gray-200 dark:border-gray-600 pl-4">
                                <p className="text-gray-900 dark:text-white font-semibold text-base">To: {stripParentheses(getStationName(selectedLine, train.dest, 'tc'))}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{getLineName(selectedLine)}</p>
                            </div>
                        </div>
                        <div className="text-lg font-bold text-gray-800 dark:text-gray-100 pr-2">
                           {train.ttnt === '0' ? 'Arriving' : `${train.ttnt} min`}
                        </div>
                    </div>
                ))}
            </div>
        )
    };

    return (
        <div className="space-y-6 pt-4">
            <div className="bg-gradient-to-br from-teal-50 via-white to-teal-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6 rounded-3xl shadow-2xl space-y-6 border border-teal-200 dark:border-teal-700 transition-all">
                <div className="relative">
                    <div className="relative group">
                        <select
                            value={selectedLine}
                            onChange={(e) => setSelectedLine(e.target.value)}
                            className="w-full appearance-none bg-gradient-to-r from-teal-50 via-white to-teal-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 border border-teal-300 dark:border-teal-700 rounded-2xl p-5 font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-[color:var(--accent)] shadow-xl transition-all text-lg sm:text-xl hover:border-[color:var(--accent)]"
                        >
                            <option value="" className="text-gray-400 dark:text-gray-500">-- 請選擇港鐵路線 --</option>
                            {mtrLines.map(line => (
                                <option key={line.code} value={line.code} className="font-bold text-base">{line.name}</option>
                            ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-[color:var(--accent)] dark:text-[color:var(--accent)]">
                            <svg className="fill-current h-6 w-6 drop-shadow" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                            </svg>
                        </div>
                    </div>
                </div>

                {selectedLine && (
                   <div className="relative animate-fade-in" ref={stationInputContainerRef}>
                        <div className="relative">
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                            <input
                                type="text"
                                value={stationSearchTerm}
                                onChange={handleSearchChange}
                                onFocus={() => setIsStationListVisible(true)}
                                placeholder={`Search station in ${getLineName(selectedLine)}`}
                                className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl p-4 pl-12 font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)] transition-all text-base sm:text-lg"
                                autoComplete="off"
                            />
                        </div>
                        {isStationListVisible && filteredStations.length > 0 && (
                            <ul className="absolute z-30 w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl mt-1 max-h-60 overflow-y-auto shadow-xl animate-fade-in">
                                {filteredStations.map(station => (
                                    <li
                                        key={station.code}
                                        onClick={() => handleStationSelect(station)}
                                        className="p-4 cursor-pointer text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600/50 rounded-lg transition-all"
                                    >
                                        <p className="font-medium">{stripParentheses(station.name_tc)}</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{stripParentheses(station.name_en)}</p>
                                    </li>
                                ))}
                            </ul>
                        )}
                   </div>
                )}
            </div>

            {loading && <Loader message="Loading MTR schedule..." />}
            {error && <ErrorDisplay message={error} />}

            {stationData && typeof stationData === 'object' && !loading && !error && activeDirection && (
                <div className="bg-gradient-to-br from-teal-50 via-white to-teal-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 rounded-2xl border border-teal-100 dark:border-teal-700/50 animate-fade-in shadow-xl">
                     <div className="flex bg-gradient-to-r from-teal-100 via-white to-teal-50 dark:from-gray-800 dark:via-gray-700 dark:to-gray-900 rounded-xl p-2 mb-3 border border-teal-100 dark:border-teal-700">
                        {(['UP', 'DOWN'] as Direction[]).map(dir => (
                            directionNames[dir] && (
                            <button
                                key={dir}
                                onClick={() => setActiveDirection(dir)}
                                className={`w-1/2 p-3 rounded-xl font-semibold text-center transition-all text-base sm:text-lg truncate ${activeDirection === dir ? 'bg-white dark:bg-gray-800 text-teal-600 dark:text-[color:var(--accent)] shadow-md' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-300/50 dark:hover:bg-gray-600/50'}`}
                            >
                                To: {directionNames[dir]}
                            </button>
                            )
                        ))}
                    </div>
                    <div className="animate-fade-in">
                        {activeDirection === 'UP' && renderArrivals(stationData.UP)}
                        {activeDirection === 'DOWN' && renderArrivals(stationData.DOWN)}
                    </div>
                </div>
            )}
             {!selectedStation && !loading && selectedLine && (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <p className="font-semibold text-lg sm:text-xl">請選擇車站</p>
                    <p className="text-base">選擇車站以查看列車時間表。</p>
                </div>
            )}
            {!selectedLine && !loading && (
                 <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <p className="font-semibold text-lg sm:text-xl">請先選擇路線</p>
                    <p className="text-base">選擇港鐵路線以開始。</p>
                </div>
            )}
        </div>
    );
};

export default MtrPanel;