
import React, { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import { Route, StopInfo, RouteStop, Eta } from './types';
import { getRouteList, getAllStops, getRouteStops, getStopEta, preloadCriticalData } from './services/kmbApi';
import { mtrStations, mtrLines, MtrStation } from './data/mtrStations';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import RouteSearch from './components/RouteSearch';
import Loader from './components/Loader';
import ErrorDisplay from './components/ErrorDisplay';
import ErrorBoundary from './components/ErrorBoundary';
import { updatePageSEO, SEO_TEMPLATES } from './utils/seo';

// Lazy load heavy components
const RouteDetails = React.lazy(() => import('./components/RouteDetails'));
const MtrPanel = React.lazy(() => import('./components/MtrPanel'));
const TripPlannerPanel = React.lazy(() => import('./components/TripPlannerPanel'));
const SettingsPanel = React.lazy(() => import('./components/SettingsPanel'));
import PWAUpdatePrompt from './components/PWAUpdatePrompt';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import { usePWA } from './hooks/usePWA';

type ActiveTab = 'planner' | 'kmb' | 'mtr' | 'settings';
type Theme = 'light' | 'dark';
export type Location = { name_tc: string; name_en: string; };


function App() {
  // KMB State
  const [rawRoutes, setRawRoutes] = useState<Route[]>([]); // For AI
  const [allRoutes, setAllRoutes] = useState<Route[]>([]); // For KMB tab display
  const [allStops, setAllStops] = useState<Map<string, StopInfo>>(new Map());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [routeStops, setRouteStops] = useState<{ outbound: RouteStop[]; inbound: RouteStop[] }>({ outbound: [], inbound: [] });
  const [etas, setEtas] = useState<Record<string, Eta[]>>({});
  
  // App-wide state
  const [activeTab, setActiveTab] = useState<ActiveTab>('planner');
  const [loading, setLoading] = useState({
    initial: true,
    details: false,
    eta: '' // stopId of the ETA being loaded
  });
  const [error, setError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string>('');
  const [theme, setTheme] = useState<Theme>('dark');

  // PWA functionality
  const {
    showUpdatePrompt,
    updateApp,
    dismissUpdate,
    isInstallable,
    installApp,
    offlineReady,
    dismissOfflineReady,
  } = usePWA();

  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  // Theme Management
  useEffect(() => {
    const storedTheme = localStorage.getItem('theme') as Theme | null;
    // Default to dark theme if no stored preference
    const initialTheme = storedTheme || 'dark';

    console.log('🔍 Theme initialization:', {
      storedTheme,
      initialTheme,
      currentTheme: theme
    });

    setTheme(initialTheme);

    // No need to listen for system theme changes since we default to dark
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    const themeMeta = document.getElementById('theme-color-meta');


    try {
      if (theme === 'dark') {
        root.classList.add('dark');
        localStorage.setItem('theme', 'dark');
        if (themeMeta) themeMeta.setAttribute('content', '#111827'); // gray-900


        // Update PWA manifest theme color if available
        const manifestLink = document.querySelector('link[rel="manifest"]') as HTMLLinkElement;
        if (manifestLink) {
          // Note: Manifest theme color updates require a new manifest file
          // This is handled by the service worker and PWA configuration
        }
      } else {
        root.classList.remove('dark');
        localStorage.setItem('theme', 'light');
        if (themeMeta) themeMeta.setAttribute('content', '#f9fafb'); // gray-50

      }

      // Dispatch custom event for other components that might need to know about theme changes
      window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme } }));

    } catch (error) {
      console.error('Error applying theme:', error);
      // Fallback to light theme if there's an error
      if (theme === 'dark') {
        root.classList.remove('dark');
        localStorage.setItem('theme', 'light');
        setTheme('light');
      }
    }
  }, [theme]);

  // PWA Install Prompt Management
  useEffect(() => {
    if (isInstallable) {
      // Show install prompt after a delay if user hasn't dismissed it
      const hasShownInstallPrompt = localStorage.getItem('pwa-install-prompt-shown');
      if (!hasShownInstallPrompt) {
        const timer = setTimeout(() => {
          setShowInstallPrompt(true);
        }, 10000); // Show after 10 seconds
        return () => clearTimeout(timer);
      }
    }
  }, [isInstallable]);

  const handleInstallApp = async () => {
    const success = await installApp();
    if (success) {
      setShowInstallPrompt(false);
      localStorage.setItem('pwa-install-prompt-shown', 'true');
    }
  };

  const handleDismissInstall = () => {
    setShowInstallPrompt(false);
    localStorage.setItem('pwa-install-prompt-shown', 'true');
  };


  useEffect(() => {
    // Load API key from local storage on initial load
    const storedApiKey = localStorage.getItem('gemini_api_key');
    if (storedApiKey) {
      setApiKey(storedApiKey);
    }

    const fetchInitialData = async () => {
      try {
        setError(null);
        setLoading(prev => ({ ...prev, initial: true }));

        // Try to preload critical data first (this will use cache if available)
        await preloadCriticalData();

        const [routesRes, stopsRes] = await Promise.all([getRouteList(), getAllStops()]);

        setRawRoutes(routesRes); // Keep all routes for AI context

        const uniqueRoutes = new Map<string, Route>();
        routesRes.forEach(route => {
            // Prioritize outbound routes for display to avoid duplicates like 1A, 1A
            if (!uniqueRoutes.has(route.route) || route.bound === 'O') {
                uniqueRoutes.set(route.route, route);
            }
        });
        setAllRoutes(Array.from(uniqueRoutes.values()).sort((a, b) => a.route.localeCompare(b.route, undefined, {numeric: true})));

        const stopsMap = new Map<string, StopInfo>();
        stopsRes.forEach(stop => stopsMap.set(stop.stop, stop));
        setAllStops(stopsMap);

      } catch (e) {
        setError('Failed to load initial bus data. Please check your connection and try again later.');
        console.error(e);
      } finally {
        setLoading(prev => ({ ...prev, initial: false }));
      }
    };

    fetchInitialData();
  }, []);
  
  const handleBack = () => {
    setSelectedRoute(null);
    setRouteStops({ outbound: [], inbound: [] });
    setEtas({});
  };

  const handleSelectRoute = useCallback(async (route: Route | null) => {
    setSelectedRoute(route);
    setRouteStops({ outbound: [], inbound: [] }); // Reset previous stops
    setEtas({}); // Reset ETAs

    if (route) {
      // Update SEO for route details
      updatePageSEO(SEO_TEMPLATES.routeDetails(route.route, route.orig_en, route.dest_en));

      try {
        setError(null);
        setLoading(prev => ({ ...prev, details: true }));
        const [outboundRes, inboundRes] = await Promise.all([
          getRouteStops(route.route, 'outbound', route.service_type),
          getRouteStops(route.route, 'inbound', route.service_type)
        ]);
        setRouteStops({ outbound: outboundRes, inbound: inboundRes });
      } catch (e) {
        setError(`Failed to load details for route ${route.route}.`);
        console.error(e);
      } finally {
        setLoading(prev => ({ ...prev, details: false }));
      }
    } else {
      // Reset to KMB page SEO when going back
      updatePageSEO(SEO_TEMPLATES.kmb);
    }
  }, []);

  const handleFetchEta = useCallback(async (stopId: string, route: string, serviceType: string) => {
    if (loading.eta === stopId) return;

    try {
      setLoading(prev => ({ ...prev, eta: stopId }));
      const etaData = await getStopEta(stopId, route, serviceType);
      setEtas(prev => ({ ...prev, [stopId]: etaData }));
    } catch (e) {
      console.error(`Failed to fetch ETA for stop ${stopId}:`, e);
      setEtas(prev => ({ ...prev, [stopId]: [] }));
    } finally {
      setLoading(prev => ({ ...prev, eta: '' }));
    }
  }, [loading.eta]);

  const handleSaveApiKey = (key: string) => {
    const trimmedKey = key.trim();
    setApiKey(trimmedKey);
    if (trimmedKey) {
        localStorage.setItem('gemini_api_key', trimmedKey);
    } else {
        localStorage.removeItem('gemini_api_key');
    }
  };

  const filteredRoutes = useMemo(() => {
    if (!searchTerm) {
      return allRoutes;
    }
    return allRoutes.filter(route =>
      route.route.toLowerCase().startsWith(searchTerm.toLowerCase())
    );
  }, [searchTerm, allRoutes]);

  const locations = useMemo((): Location[] => {
    const locationMap = new Map<string, Location>();

    // Add all bus stops
    for (const stop of allStops.values()) {
        if (stop.name_tc && !locationMap.has(stop.name_tc)) {
            locationMap.set(stop.name_tc, { name_tc: stop.name_tc, name_en: stop.name_en });
        }
    }

    // Add all MTR stations
    for (const line of Object.values(mtrStations)) {
        for (const station of line) {
             if (station.name_tc && !locationMap.has(station.name_tc)) {
                locationMap.set(station.name_tc, { name_tc: station.name_tc, name_en: station.name_en });
            }
        }
    }
    
    // Convert map to array and sort
    return Array.from(locationMap.values()).sort((a, b) => a.name_tc.localeCompare(b.name_tc, 'zh-HK'));
  }, [allStops]);

  const renderKmbContent = () => {
     if (loading.initial) return <Loader message="Loading bus data..." />;
     if (error && !loading.initial) return <ErrorDisplay message={error} />;
     
     if (!selectedRoute) {
        return (
          <RouteSearch
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            routes={filteredRoutes}
            onSelectRoute={handleSelectRoute}
          />
        )
     }
     return (
        <Suspense fallback={<Loader message="Loading route details..." />}>
          <RouteDetails
              route={selectedRoute}
              stops={routeStops}
              stopInfos={allStops}
              etas={etas}
              onFetchEta={handleFetchEta}
              loadingDetails={loading.details}
              loadingEtaStopId={loading.eta}
              theme={theme}
          />
        </Suspense>
     )
  }
  
  // Update SEO when tab changes
  useEffect(() => {
    switch(activeTab) {
      case 'planner':
        updatePageSEO(SEO_TEMPLATES.planner);
        break;
      case 'kmb':
        if (!selectedRoute) {
          updatePageSEO(SEO_TEMPLATES.kmb);
        }
        break;
      case 'mtr':
        updatePageSEO(SEO_TEMPLATES.mtr);
        break;
      case 'settings':
        updatePageSEO(SEO_TEMPLATES.settings);
        break;
      default:
        updatePageSEO(SEO_TEMPLATES.home);
    }
  }, [activeTab, selectedRoute]);

  const renderContent = () => {
    switch(activeTab) {
      case 'planner':
        return (
          <Suspense fallback={<Loader message="Loading trip planner..." />}>
            <TripPlannerPanel allRoutes={rawRoutes} locations={locations} apiKey={apiKey} />
          </Suspense>
        );
      case 'kmb':
        return renderKmbContent();
      case 'mtr':
        return (
          <Suspense fallback={<Loader message="Loading MTR information..." />}>
            <MtrPanel />
          </Suspense>
        );
      case 'settings':
        return (
          <Suspense fallback={<Loader message="Loading settings..." />}>
            <SettingsPanel currentApiKey={apiKey} onSaveApiKey={handleSaveApiKey} theme={theme} setTheme={setTheme} />
          </Suspense>
        );
      default:
        return null;
    }
  }

  const showBack = activeTab === 'kmb' && !!selectedRoute;

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 font-sans flex flex-col">
        <Header
          onBack={handleBack}
          showBack={showBack}
        />
        <main className="px-4 max-w-4xl w-full mx-auto flex-grow pb-24 flex flex-col">
          {renderContent()}
        </main>
         {!showBack && <BottomNav
          activeTab={activeTab}
          setActiveTab={setActiveTab}
         />}

         {/* PWA Components */}
         <PWAUpdatePrompt
           show={showUpdatePrompt}
           onUpdate={updateApp}
           onDismiss={dismissUpdate}
         />
         <PWAInstallPrompt
           show={showInstallPrompt && isInstallable}
           onInstall={handleInstallApp}
           onDismiss={handleDismissInstall}
         />

         {/* Offline Ready Notification */}
         {offlineReady && (
           <div className="fixed bottom-4 left-4 right-4 z-40 animate-fade-in">
             <div className="bg-green-100 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded-lg p-3">
               <div className="flex items-center justify-between">
                 <div className="flex items-center space-x-2">
                   <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                     <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                     </svg>
                   </div>
                   <span className="text-sm font-medium text-green-800 dark:text-green-200">
                     App ready to work offline
                   </span>
                 </div>
                 <button
                   onClick={dismissOfflineReady}
                   className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200"
                 >
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                   </svg>
                 </button>
               </div>
             </div>
           </div>
         )}
      </div>
    </ErrorBoundary>
  );
}

export default App;