import React, { useState, useEffect, useCallback, useRef, Suspense, useMemo } from 'react';
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
  theme?: Theme;
}

type Region = 'HKI' | 'KLN' | 'NT';

const MinibusPanel: React.FC<MinibusPanelProps> = ({ onBack, showBack, onSelectRoute, theme = 'light' }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [allRoutes, setAllRoutes] = useState<MinibusRoute[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<MinibusRoute | null>(null);
  const [routeStops, setRouteStops] = useState<MinibusStop[]>([]);
  const [etas, setEtas] = useState<Record<string, MinibusEta[]>>({});
  const [activeStop, setActiveStop] = useState<string | null>(null);
  const [activeDirection, setActiveDirection] = useState(0);
  const [loading, setLoading] = useState({
    initial: true,
    details: false,
    eta: '' // stopId of the ETA being loaded
  });
  const [error, setError] = useState<string | null>(null);
  const stopRefs = useRef<Record<string, HTMLLIElement | null>>({});

  // 滾動到活動站點
  useEffect(() => {
    if (activeStop && stopRefs.current[activeStop]) {
      stopRefs.current[activeStop]?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [activeStop]);

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

  const handleSelectRoute = useCallback(async (route: MinibusRoute | null) => {
    setSelectedRoute(route);
    setRouteStops([]); // Reset previous stops
    setEtas({}); // Reset ETAs
    if (onSelectRoute) {
      onSelectRoute(route); // 通知父组件路线选择变化
    }

    if (route) {
      try {
        setError(null);
        setLoading(prev => ({ ...prev, details: true }));
        // 找到當前選定的變體索引
        const variantIndex = route.variants?.findIndex(v => v.route_id.toString() === route.serviceType) ?? 0;
        const stops = await getMinibusStops(route.routeId, variantIndex, activeDirection);
        setRouteStops(stops);
      } catch (e) {
        setError(`無法載入路線 ${route.routeNo} 的詳情`);
        console.error(e);
      } finally {
        setLoading(prev => ({ ...prev, details: false }));
      }
    }
  }, [onSelectRoute, activeDirection]);

  const handleFetchEta = useCallback(async (stopId: string, routeId: string) => {
    if (loading.eta === stopId) return;

    try {
      setLoading(prev => ({ ...prev, eta: stopId }));
      // 找到當前選定的變體索引
      if (selectedRoute) {
        const variantIndex = selectedRoute.variants?.findIndex(v => v.route_id.toString() === selectedRoute.serviceType) ?? 0;
        const etaData = await getMinibusEta(stopId, routeId, variantIndex, activeDirection);
        setEtas(prev => ({ ...prev, [stopId]: etaData }));
      }
    } catch (e) {
      console.error(`無法載入站點 ${stopId} 的ETA:`, e);
      setEtas(prev => ({ ...prev, [stopId]: [] }));
    } finally {
      setLoading(prev => ({ ...prev, eta: '' }));
    }
  }, [loading.eta, selectedRoute, activeDirection]);

  // Filter and sort routes based on search term and selected region
  const filteredRoutes = useMemo(() => {
    return allRoutes
      .filter(route => {
        const matchesSearch = searchTerm === '' ||
          route.routeNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
          route.orig_tc.toLowerCase().includes(searchTerm.toLowerCase()) ||
          route.dest_tc.toLowerCase().includes(searchTerm.toLowerCase()) ||
          route.orig_en.toLowerCase().includes(searchTerm.toLowerCase()) ||
          route.dest_en.toLowerCase().includes(searchTerm.toLowerCase());
        
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
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 flex-shrink-0 animate-fade-in">
          <div className="flex items-center gap-3 sm:gap-4">
            {showBack && (
              <button
                onClick={() => {
                  setSelectedRoute(null);
                  onBack();
                }}
                className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex-shrink-0 -ml-2"
                aria-label="返回"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <div className="bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-800 font-bold rounded-lg w-14 h-10 text-lg sm:w-16 sm:h-12 sm:text-xl flex items-center justify-center flex-shrink-0">
              {selectedRoute.routeNo}
            </div>
            <div className="overflow-hidden flex-grow min-w-0">
              <p className="text-gray-900 dark:text-white font-bold text-base sm:text-lg truncate">{selectedRoute.orig_tc}</p>
              <p className="text-gray-400 dark:text-gray-500 text-xs sm:text-sm font-medium my-0.5">→</p>
              <p className="text-gray-600 dark:text-gray-300 font-semibold text-sm sm:text-base truncate">{selectedRoute.dest_tc}</p>
              {selectedRoute.variants && selectedRoute.variants.length > 1 && (
                <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">
                  {selectedRoute.variants.length} 個變體
                </p>
              )}
            </div>
          </div>
        </div>

        {/* 變體和方向選擇器 */}
        {selectedRoute?.variants && selectedRoute.variants.length > 1 && (
          <div className="sticky top-[64px] bg-gray-50/80 dark:bg-gray-900/80 backdrop-blur-md py-3 z-10 -mx-4 px-4 flex-shrink-0 border-y border-gray-200 dark:border-gray-800">
            <div className="bg-gray-200 dark:bg-gray-700/50 rounded-xl p-1">
              <div className="flex bg-gray-200 dark:bg-gray-700/50 rounded-xl p-1 overflow-x-auto scrollbar-hide">
                {selectedRoute.variants.map((variant, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      // 更新選定的變體
                      const updatedRoute = {
                        ...selectedRoute,
                        directions: variant.directions,
                        orig_tc: variant.directions[0]?.orig_tc || selectedRoute.orig_tc,
                        dest_tc: variant.directions[0]?.dest_tc || selectedRoute.dest_tc,
                        serviceType: variant.route_id.toString()
                      };
                      setSelectedRoute(updatedRoute);
                      setActiveDirection(0);
                      handleSelectRoute(updatedRoute);
                    }}
                    className={`flex-1 min-w-[120px] sm:min-w-[150px] p-2.5 rounded-lg font-semibold text-center transition-all text-sm whitespace-nowrap ${
                      selectedRoute.serviceType === variant.route_id.toString()
                        ? 'bg-white dark:bg-gray-800 text-teal-600 dark:text-[color:var(--accent)] shadow-md'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-300/50 dark:hover:bg-gray-600/50'
                    }`}
                  >
                    {variant.description_tc || `變體 ${index + 1}`}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {/* 方向選擇器 */}
        {selectedRoute?.directions && selectedRoute.directions.length > 1 && (
          <div className="sticky top-[64px] bg-gray-50/80 dark:bg-gray-900/80 backdrop-blur-md py-3 z-10 -mx-4 px-4 flex-shrink-0 border-y border-gray-200 dark:border-gray-800">
            <div className="bg-gray-200 dark:bg-gray-700/50 rounded-xl p-1">
              <div className="flex bg-gray-200 dark:bg-gray-700/50 rounded-xl p-1 overflow-x-auto scrollbar-hide">
                {selectedRoute.directions.map((direction, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setActiveDirection(index);
                      // 重新加載站點數據
                      if (selectedRoute) {
                        handleSelectRoute({
                          ...selectedRoute,
                          directions: selectedRoute.directions
                        });
                      }
                    }}
                    className={`flex-1 min-w-[120px] sm:min-w-[150px] p-2.5 rounded-lg font-semibold text-center transition-all text-sm whitespace-nowrap ${
                      activeDirection === index
                        ? 'bg-white dark:bg-gray-800 text-teal-600 dark:text-[color:var(--accent)] shadow-md'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-300/50 dark:hover:bg-gray-600/50'
                    }`}
                  >
                    往 {direction.dest_tc || selectedRoute.dest_tc}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
        {loading.details ? (
          <Loader message="載入站點詳情..." />
        ) : (
          <div className="flex flex-col flex-grow min-h-0 border border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden animate-fade-in">
            {/* 地圖視圖 */}
            <div className="relative h-[250px] md:h-[300px] flex-shrink-0">
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
                    activeStopId={Object.keys(etas).find(id => etas[id]?.length > 0) || null}
                    onMarkerClick={(stopId) => handleFetchEta(stopId, selectedRoute.routeId)}
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
                    return (
                      <li
                        key={stop.stopId}
                        ref={el => { stopRefs.current[stop.stopId] = el; }}
                        className="my-1.5"
                      >
                        <div
                          className={`border-l-4 rounded-r-lg ${isActive ? 'bg-teal-50 dark:bg-teal-900/20 border-[color:var(--accent)]' : 'bg-white dark:bg-gray-800 border-transparent'} border dark:border-gray-700 rounded-lg overflow-hidden transition-all duration-300 shadow-sm`}
                        >
                          <div
                            onClick={() => {
                              if (!isActive) {
                                handleFetchEta(stop.stopId, selectedRoute.routeId);
                              }
                              setActiveStop(isActive ? null : stop.stopId);
                            }}
                            className="p-3 flex items-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50"
                          >
                            <div className={`w-8 h-8 flex items-center justify-center mr-4 text-sm flex-shrink-0 transition-colors border border-gray-300 dark:border-gray-600 rounded ${isActive ? 'bg-[color:var(--accent)] text-[color:var(--accent-text)] border-transparent' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300'}`}>
                              {index + 1}
                            </div>
                            <div className="flex-grow min-w-0 mr-2">
                              <div className="flex items-center gap-2">
                                <p className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base truncate">{stop.name_tc}</p>
                                {loading.eta === stop.stopId && (
                                  <Loader size="small" message={null} />
                                )}
                              </div>
                              <p className="text-gray-500 dark:text-gray-400 text-xs truncate">{stop.name_en}</p>
                            </div>
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className={`h-5 w-5 text-gray-400 dark:text-gray-500 transition-transform duration-300 ${isActive ? 'rotate-180' : ''}`}
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                          {isActive && (
                            <div className="bg-white dark:bg-gray-800/50 px-3 pb-3">
                              <div className="border-t border-gray-100 dark:border-gray-700/50 pt-3">
                                <StopEtaDisplay
                                  etas={etas[stop.stopId] || []}
                                  onRefresh={() => handleFetchEta(stop.stopId, selectedRoute.routeId)}
                                  refreshInterval={30000}
                                />
                              </div>
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