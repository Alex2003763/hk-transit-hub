import React, { useState, useEffect, useCallback, Suspense, useMemo } from 'react';
import Loader from './Loader';
import ErrorDisplay from './ErrorDisplay';
import StopEtaDisplay from './StopEtaDisplay';
import MapSkeleton from './MapSkeleton';
import ErrorBoundary from './ErrorBoundary';
import MinibusRouteSearch from './MinibusRouteSearch';
import { MinibusRoute, MinibusStop, MinibusEta, Theme } from '../types';
import { getMinibusRoutes, getMinibusStops, getMinibusEta } from '../services/minibusApi';

// 懶加載地圖組件
const MapView = React.lazy(() => import('./MapView'));

interface MinibusPanelProps {
  onBack: () => void;
  showBack: boolean;
  onSelectRoute: (route: MinibusRoute | null) => void;
  externalSelectedRoute: MinibusRoute | null;
  theme?: Theme;
}

type Region = 'HKI' | 'KLN' | 'NT';

const MinibusPanel: React.FC<MinibusPanelProps> = ({ onBack, showBack, onSelectRoute, externalSelectedRoute, theme = 'light' }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [allRoutes, setAllRoutes] = useState<MinibusRoute[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<MinibusRoute | null>(null);
  const [routeStops, setRouteStops] = useState<MinibusStop[]>([]);
  const [etas, setEtas] = useState<Record<string, MinibusEta[]>>({});
  const [loading, setLoading] = useState({
    initial: true,
    details: false,
    eta: '' // stopId of the ETA being loaded
  });
  const [error, setError] = useState<string | null>(null);
  const [activeStop, setActiveStop] = useState<string | null>(null);

  // Reset internal selectedRoute when the external prop changes to null
  useEffect(() => {
    if (externalSelectedRoute === null && selectedRoute !== null) {
      setSelectedRoute(null);
      setRouteStops([]); // Clear previous stops
      setEtas({}); // Clear previous ETAs
      setActiveStop(null); // Reset active stop
    }
  }, [externalSelectedRoute, selectedRoute]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setError(null);
        setLoading(prev => ({ ...prev, initial: true }));
        const routes = await getMinibusRoutes();
        setAllRoutes(routes);
      } catch (e) {
        setError('無法載入小巴路線資料');
        console.error(e);
      } finally {
        setLoading(prev => ({ ...prev, initial: false }));
      }
    };
    fetchInitialData();
  }, []);

  const handleSelectRoute = useCallback(async (route: MinibusRoute) => {
    setSelectedRoute(route);
    setRouteStops([]); // Clear previous stops
    setEtas({}); // Clear previous ETAs
    setActiveStop(null); // Reset active stop
    if (onSelectRoute) {
      onSelectRoute(route);
    }

    if (route) {
      try {
        setError(null);
        setLoading(prev => ({ ...prev, details: true }));
        const stops = await getMinibusStops(route.routeId);
        setRouteStops(stops);
      } catch (e) {
        setError(`無法載入路線 ${route.routeNo} 的詳情`);
        console.error(e);
      } finally {
        setLoading(prev => ({ ...prev, details: false }));
      }
    }
  }, [onSelectRoute]);

  const handleFetchEta = useCallback(async (stopId: string, routeId: string) => {
    if (loading.eta === stopId) return;

    try {
      setLoading(prev => ({ ...prev, eta: stopId }));
      const etaData = await getMinibusEta(stopId, routeId);
      setEtas(prev => ({ ...prev, [stopId]: etaData }));
    } catch (e) {
      console.error(`無法載入站點 ${stopId} 的ETA:`, e);
      setEtas(prev => ({ ...prev, [stopId]: [] }));
    } finally {
      setLoading(prev => ({ ...prev, eta: '' }));
    }
  }, [loading.eta]);

  // Filter and sort routes based on search term and selected region
  const filteredRoutes = useMemo(() => {
    return allRoutes
      .filter(route => {
        const matchesSearch = searchTerm === '' ||
          route.routeNo.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesRegion = !selectedRegion || route.routeId.startsWith(selectedRegion);
        
        return matchesSearch && matchesRegion;
      })
      .sort((a, b) => {
        // 首先按照路線號碼排序
        const aNum = parseInt(a.routeNo.match(/\d+/)?.[0] || '0');
        const bNum = parseInt(b.routeNo.match(/\d+/)?.[0] || '0');
        if (aNum !== bNum) return aNum - bNum;
        
        // 如果路線號碼相同，按照完整路線號碼排序
        return a.routeNo.localeCompare(b.routeNo);
      });
  }, [allRoutes, searchTerm, selectedRegion]);

  const renderContent = () => {
    if (loading.initial) return <Loader message="載入小巴資料中..." />;
    if (error && !loading.initial) return <ErrorDisplay message={error} />;

    if (!selectedRoute) {
      return (
        <MinibusRouteSearch
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          selectedRegion={selectedRegion}
          setSelectedRegion={setSelectedRegion}
          routes={filteredRoutes}
          onSelectRoute={handleSelectRoute}
        />
      );
    }

    return (
      <div className="flex flex-col gap-4 flex-grow">
        {/* 路線資訊卡 */}
        <div className="bg-gradient-to-br from-teal-50 via-white to-teal-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 sm:p-6 rounded-3xl shadow-2xl border border-teal-200 dark:border-teal-700 flex-shrink-0 animate-fade-in transition-all duration-300">
          <div className="flex items-center">
            <div className="bg-green-600 dark:bg-green-500 text-white font-bold rounded-lg px-4 h-12 text-xl mr-4 flex-shrink-0 flex items-center justify-center">
              <span className="text-base">{selectedRoute.routeNo} ({selectedRoute.region_tc})</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-gray-900 dark:text-white font-extrabold text-xl sm:text-2xl leading-tight truncate" title={selectedRoute.orig_tc}>
                {selectedRoute.orig_tc}
              </p>
            </div>
          </div>
        </div>

        {loading.details ? (
          <Loader message="載入站點詳情..." />
        ) : (
          <div className="flex flex-col flex-grow min-h-0 border border-teal-100 dark:border-teal-700/50 bg-gradient-to-br from-white via-teal-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 rounded-3xl shadow-2xl overflow-hidden animate-fade-in transition-all duration-300">
            {/* 地圖視圖 */}
            <div className="h-[250px] md:h-[300px] flex-shrink-0">
              <ErrorBoundary fallback={<MapSkeleton className="h-full w-full" />}>
                <Suspense fallback={<MapSkeleton className="h-full w-full" />}>
                  <MapView
                    stops={routeStops.map((stop, index) => ({
                      route: selectedRoute.routeId,
                      bound: 'O',
                      service_type: selectedRoute.serviceType,
                      seq: index + 1,
                      stop: stop.stopId
                    }))}
                    stopInfos={new Map(routeStops.map(stop => [
                      stop.stopId,
                      {
                        stop: stop.stopId,
                        name_tc: stop.name_tc,
                        name_en: stop.name_en,
                        name_sc: stop.name_tc, // 由於小巴沒有簡體資料，使用繁體替代
                        lat: stop.lat.toString(),
                        long: stop.lng.toString()
                      }
                    ]))}
                    theme={theme}
                    activeStopId={activeStop}
                    onMarkerClick={(stopId) => {
                      setActiveStop(stopId);
                      handleFetchEta(stopId, selectedRoute.routeId);
                    }}
                    showClustering={false}
                    maxClusterRadius={60}
                  />
                </Suspense>
              </ErrorBoundary>
            </div>
            <div className="flex-grow overflow-y-auto bg-gray-100 dark:bg-gray-900 pt-2">
              {routeStops.length === 0 && !error ? (
                <div className="text-center py-10 text-gray-500 dark:text-gray-400">沒有站點資料</div>
              ) : (
                <ul className="px-2">
                  {routeStops.map((stop, index) => {
                    const isActive = activeStop === stop.stopId;
                    const isLoadingEta = loading.eta === stop.stopId;

                    const handleToggle = () => {
                      if (!isActive) {
                        handleFetchEta(stop.stopId, selectedRoute.routeId);
                      }
                      setActiveStop(isActive ? null : stop.stopId);
                    };

                    return (
                      <li key={stop.stopId} className="my-1.5">
                        <div
                          className={`border-l-4 rounded-r-lg ${isActive ? 'bg-teal-50 dark:bg-teal-900/20 border-[color:var(--accent)]' : 'bg-white dark:bg-gray-800 border-transparent'} border dark:border-gray-700 rounded-lg overflow-hidden transition-all duration-300 shadow-sm`}
                        >
                          <div
                            onClick={handleToggle}
                            className="p-3 flex items-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50"
                          >
                            <div className={`font-bold rounded-full w-8 h-8 flex items-center justify-center mr-4 text-sm flex-shrink-0 transition-colors ${isActive ? 'bg-[color:var(--accent)] text-[color:var(--accent-text)]' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
                              {index + 1}
                            </div>
                            <div className="flex-grow">
                              <p className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">{stop.name_tc}</p>
                              <p className="text-gray-500 dark:text-gray-400 text-xs">{stop.name_en}</p>
                            </div>
                            <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 text-gray-400 dark:text-gray-500 transition-transform duration-300 ${isActive ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                          {isActive && (
                            <div className="bg-white dark:bg-gray-800/50 px-3 pb-3">
                              {isLoadingEta ? (
                                <div className="flex justify-center items-center py-4">
                                  <Loader message="Fetching ETA..."/>
                                </div>
                              ) : (
                                <StopEtaDisplay
                                  etas={etas[stop.stopId] || []}
                                  onRefresh={() => handleFetchEta(stop.stopId, selectedRoute.routeId)}
                                  refreshInterval={30000}
                                />
                              )}
                            </div>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
      {renderContent()}
    </div>
  );
};

export default MinibusPanel;