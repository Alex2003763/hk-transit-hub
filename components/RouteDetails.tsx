import React, { useState, useRef, useEffect, Suspense } from 'react';
import { Route, RouteStop, StopInfo, Eta } from '../types';
import Loader from './Loader';
import StopEtaDisplay from './StopEtaDisplay';
import MapSkeleton from './MapSkeleton';
import ErrorBoundary from './ErrorBoundary';

// Lazy load the heavy MapView component
const MapView = React.lazy(() => import('./MapView'));

type Direction = 'outbound' | 'inbound';
type Theme = 'light' | 'dark';

interface StopListItemProps {
  stop: RouteStop;
  stopInfo?: StopInfo;
  etas: Eta[];
  onFetchEta: () => void;
  isLoadingEta: boolean;
  isActive: boolean;
  onToggle: () => void;
}

const StopListItem: React.FC<StopListItemProps & { ref: React.Ref<HTMLLIElement> }> = React.forwardRef<HTMLLIElement, StopListItemProps>(
  ({ stop, stopInfo, etas, onFetchEta, isLoadingEta, isActive, onToggle }, ref) => {

  const stripParentheses = (text: string | undefined | null): string => {
    if (!text) return '';
    return text.replace(/\s*\([^)]*\)\s*/g, '').trim();
  };
  
  const handleToggle = () => {
    if (!isActive) {
      onFetchEta();
    }
    onToggle();
  };
  
  return (
    <li ref={ref} className={`border-l-4 rounded-r-lg ${isActive ? 'bg-teal-50 dark:bg-teal-900/20 border-[color:var(--accent)]' : 'bg-white dark:bg-gray-800 border-transparent'} border dark:border-gray-700 rounded-lg overflow-hidden transition-all duration-300 shadow-sm my-1.5`}>
      <div onClick={handleToggle} className="p-3 flex items-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50">
        <div className={`font-bold rounded-full w-8 h-8 flex items-center justify-center mr-4 text-sm flex-shrink-0 transition-colors ${isActive ? 'bg-[color:var(--accent)] text-[color:var(--accent-text)]' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
          {stop.seq}
        </div>
        <div className="flex-grow">
          <p className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">{stripParentheses(stopInfo?.name_tc) || `Stop ID: ${stop.stop}`}</p>
          <p className="text-gray-500 dark:text-gray-400 text-xs">{stripParentheses(stopInfo?.name_en) || 'Loading...'}</p>
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
              etas={etas}
              onRefresh={() => onFetchEta()}
              refreshInterval={30000}
            />
          )}
        </div>
      )}
    </li>
  );
});


interface StopListProps {
  stops: RouteStop[];
  stopInfos: Map<string, StopInfo>;
  route: Route;
  etas: Record<string, Eta[]>;
  onFetchEta: (stopId: string, route: string, serviceType: string) => void;
  loadingEtaStopId: string;
  activeStop: string | null;
  setActiveStop: (stopId: string | null) => void;
}

const StopList: React.FC<StopListProps> = ({ stops, stopInfos, route, etas, onFetchEta, loadingEtaStopId, activeStop, setActiveStop }) => {
  const stopRefs = useRef<Record<string, HTMLLIElement | null>>({});

  useEffect(() => {
    if (activeStop && stopRefs.current[activeStop]) {
      stopRefs.current[activeStop]?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [activeStop]);

  if (stops.length === 0) {
    return <div className="text-center py-10 text-gray-500 dark:text-gray-400">No stops available for this direction.</div>;
  }

  return (
    <ul className="px-2">
      {stops.map((stop, index) => (
        <StopListItem
          ref={el => { stopRefs.current[stop.stop] = el; }}
          key={`${stop.stop}-${index}-${stop.seq || ''}`}
          stop={stop}
          stopInfo={stopInfos.get(stop.stop)}
          etas={etas[stop.stop] || []}
          onFetchEta={() => onFetchEta(stop.stop, route.route, route.service_type)}
          isLoadingEta={loadingEtaStopId === stop.stop}
          isActive={activeStop === stop.stop}
          onToggle={() => setActiveStop(activeStop === stop.stop ? null : stop.stop)}
        />
      ))}
    </ul>
  );
};


interface RouteDetailsProps {
  route: Route;
  stops: { outbound: RouteStop[]; inbound: RouteStop[] };
  stopInfos: Map<string, StopInfo>;
  etas: Record<string, Eta[]>;
  onFetchEta: (stopId: string, route: string, serviceType: string) => void;
  loadingDetails: boolean;
  loadingEtaStopId: string;
  theme: Theme;
  onBack?: () => void;
  showBack?: boolean;
}

const RouteDetails: React.FC<RouteDetailsProps> = ({ route, stops, stopInfos, etas, onFetchEta, loadingDetails, loadingEtaStopId, theme, onBack, showBack }) => {
  const [direction, setDirection] = useState<Direction>('outbound');
  const [activeStop, setActiveStop] = useState<string | null>(null);

  const stripParentheses = (text: string | undefined | null): string => {
    if (!text) return '';
    return text.replace(/\s*\([^)]*\)\s*/g, '').trim();
  };

  // A route is considered circular or one-way if the API returns no stops for the inbound direction.
  const isCircularOrOneWay = stops.inbound.length === 0;

  const outboundDest = stripParentheses(stopInfos.get(stops.outbound[stops.outbound.length - 1]?.stop)?.name_tc) || stripParentheses(route.dest_tc);
  const inboundDest = stripParentheses(stopInfos.get(stops.inbound[stops.inbound.length - 1]?.stop)?.name_tc) || stripParentheses(route.orig_tc);

  const handleSetDirection = (dir: Direction) => {
    setDirection(dir);
    setActiveStop(null); // Close any open stop when switching tabs
  };
  
  const currentStops = isCircularOrOneWay ? stops.outbound : (direction === 'outbound' ? stops.outbound : stops.inbound);

  const handleMarkerClick = (stopId: string) => {
    setActiveStop(stopId);
    // Also fetch ETA when a map marker is clicked
    onFetchEta(stopId, route.route, route.service_type);
  }

  return (
    <div className="flex flex-col gap-4 flex-grow pt-4">
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 flex-shrink-0 animate-fade-in">
        <div className="flex items-center gap-3 sm:gap-4">
          {showBack && (
            <button
              onClick={onBack}
              className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex-shrink-0 -ml-2"
              aria-label="返回"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          <div className="bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-800 font-bold rounded-lg w-14 h-10 text-lg sm:w-16 sm:h-12 sm:text-xl flex items-center justify-center flex-shrink-0">
            {route.route}
          </div>
          <div className="overflow-hidden flex-grow min-w-0">
             <p className="text-gray-900 dark:text-white font-bold text-base sm:text-lg truncate">{stripParentheses(route.orig_tc)}</p>
             <p className="text-gray-400 dark:text-gray-500 text-xs sm:text-sm font-medium my-0.5">→</p>
             <p className="text-gray-600 dark:text-gray-300 font-semibold text-sm sm:text-base truncate">{stripParentheses(route.dest_tc)}</p>
          </div>
        </div>
      </div>
      
      <div className="sticky top-[64px] bg-gray-50/80 dark:bg-gray-900/80 backdrop-blur-md py-3 z-10 -mx-4 px-4 flex-shrink-0 border-y border-gray-200 dark:border-gray-800">
        {isCircularOrOneWay ? (
           <div className="bg-gray-200 dark:bg-gray-800 rounded-xl p-1 text-center">
             <div className="w-full p-2 rounded-lg font-semibold text-gray-700 dark:text-gray-300 text-sm">
                Route Stops (Circular)
            </div>
           </div>
        ) : (
          <div className="flex bg-gray-200 dark:bg-gray-700/50 rounded-xl p-1">
            <button
              onClick={() => handleSetDirection('outbound')}
              className={`w-1/2 p-2.5 rounded-lg font-semibold text-center transition-all text-sm truncate ${direction === 'outbound' ? 'bg-white dark:bg-gray-800 text-teal-600 dark:text-[color:var(--accent)] shadow-md' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-300/50 dark:hover:bg-gray-600/50'}`}
            >
              To: {outboundDest}
            </button>
            <button
              onClick={() => handleSetDirection('inbound')}
              className={`w-1/2 p-2.5 rounded-lg font-semibold text-center transition-all text-sm truncate ${direction === 'inbound' ? 'bg-white dark:bg-gray-800 text-teal-600 dark:text-[color:var(--accent)] shadow-md' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-300/50 dark:hover:bg-gray-600/50'}`}
            >
               To: {inboundDest}
            </button>
          </div>
        )}
      </div>

      {loadingDetails ? (
        <Loader message="Loading route stops..." />
      ) : (
        <div className="flex flex-col flex-grow min-h-0 border border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden animate-fade-in">
            <div className="h-[250px] md:h-[300px] flex-shrink-0">
                <ErrorBoundary fallback={<MapSkeleton className="h-full w-full" />}>
                  <Suspense fallback={<MapSkeleton className="h-full w-full" />}>
                    <MapView
                        stops={currentStops}
                        stopInfos={stopInfos}
                        theme={theme}
                        activeStopId={activeStop}
                        onMarkerClick={handleMarkerClick}
                        showClustering={false}
                        maxClusterRadius={60}
                    />
                  </Suspense>
                </ErrorBoundary>
            </div>
            <div className="flex-grow overflow-y-auto bg-gray-100 dark:bg-gray-900 pt-2">
                <StopList
                    stops={currentStops}
                    stopInfos={stopInfos}
                    route={route}
                    etas={etas}
                    onFetchEta={onFetchEta}
                    loadingEtaStopId={loadingEtaStopId}
                    activeStop={activeStop}
                    setActiveStop={setActiveStop}
                />
            </div>
        </div>
      )}
    </div>
  );
};

export default RouteDetails;