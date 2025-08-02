import React, { useMemo, useEffect, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L, { LatLngExpression, LatLngBounds } from 'leaflet';
import { RouteStop, StopInfo } from '../types';
import MapSkeleton from './MapSkeleton';

type Theme = 'light' | 'dark';

// Component to recenter map when stops or active stop changes
const MapUpdater = ({ bounds, activeStopInfo }: { bounds: LatLngBounds | null, activeStopInfo: StopInfo | undefined }) => {
  const map = useMap();
  useEffect(() => {
    if (activeStopInfo) {
      map.setView([parseFloat(activeStopInfo.lat), parseFloat(activeStopInfo.long)], 16, { animate: true });
    } else if (bounds) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [bounds, activeStopInfo, map]);
  return null;
}

// Component to add map controls
const MapControls = () => {
  const map = useMap();
  const [isLocating, setIsLocating] = useState(false);

  const handleLocateUser = useCallback(() => {
    if (navigator.geolocation && !isLocating) {
      setIsLocating(true);

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          map.setView([latitude, longitude], 16, { animate: true });

          // Add a temporary marker for user location with improved styling
          const userMarker = L.marker([latitude, longitude], {
            icon: L.divIcon({
              html: `
                <div style="
                  width: 20px;
                  height: 20px;
                  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
                  border: 3px solid white;
                  border-radius: 50%;
                  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.4);
                  animation: userLocationPulse 2s infinite;
                "></div>
                <style>
                  @keyframes userLocationPulse {
                    0% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.2); opacity: 0.8; }
                    100% { transform: scale(1); opacity: 1; }
                  }
                </style>
              `,
              className: 'user-location-marker',
              iconSize: [20, 20],
              iconAnchor: [10, 10]
            })
          }).addTo(map);

          // Remove marker after 5 seconds
          setTimeout(() => {
            map.removeLayer(userMarker);
          }, 5000);

          setIsLocating(false);
        },
        (error) => {
          console.error('Error getting user location:', error);
          console.log('Location error details:', {
            code: error.code,
            message: error.message,
            PERMISSION_DENIED: error.code === 1,
            POSITION_UNAVAILABLE: error.code === 2,
            TIMEOUT: error.code === 3
          });

          // Try again with different settings if not permission denied
          if (error.code !== 1) {
            console.log('Retrying with basic settings...');
            navigator.geolocation.getCurrentPosition(
              (position) => {
                const { latitude, longitude } = position.coords;
                map.setView([latitude, longitude], 16, { animate: true });

                const userMarker = L.marker([latitude, longitude], {
                  icon: L.divIcon({
                    html: `
                      <div style="
                        width: 20px;
                        height: 20px;
                        background: linear-gradient(135deg, #3b82f6, #1d4ed8);
                        border: 3px solid white;
                        border-radius: 50%;
                        box-shadow: 0 2px 8px rgba(59, 130, 246, 0.4);
                        animation: userLocationPulse 2s infinite;
                      "></div>
                      <style>
                        @keyframes userLocationPulse {
                          0% { transform: scale(1); opacity: 1; }
                          50% { transform: scale(1.2); opacity: 0.8; }
                          100% { transform: scale(1); opacity: 1; }
                        }
                      </style>
                    `,
                    className: 'user-location-marker',
                    iconSize: [20, 20],
                    iconAnchor: [10, 10]
                  })
                }).addTo(map);

                setTimeout(() => {
                  map.removeLayer(userMarker);
                }, 5000);

                setIsLocating(false);
              },
              (retryError) => {
                console.error('Retry failed:', retryError);
                setIsLocating(false);
              },
              { enableHighAccuracy: false, timeout: 15000, maximumAge: 0 }
            );
          } else {
            setIsLocating(false);
          }
        },
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
      );
    }
  }, [map, isLocating]);

  useEffect(() => {
    // Add custom locate control with modern styling
    const locateControl = L.control({ position: 'topright' });
    locateControl.onAdd = () => {
      const div = L.DomUtil.create('div', 'leaflet-control-custom-locate');
      div.innerHTML = `
        <button type="button" title="Find my location" aria-label="Find my location" class="locate-btn">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="location-icon">
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1"></path>
          </svg>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="loading-icon" style="display: none;">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M12 6v6l4 2"></path>
          </svg>
        </button>
      `;

      const button = div.querySelector('.locate-btn') as HTMLButtonElement;
      const locationIcon = div.querySelector('.location-icon') as SVGElement;
      const loadingIcon = div.querySelector('.loading-icon') as SVGElement;

      if (button) {
        // Apply modern styling
        Object.assign(button.style, {
          width: '40px',
          height: '40px',
          backgroundColor: 'white',
          border: '2px solid rgba(0,0,0,0.1)',
          borderRadius: '8px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          transition: 'all 0.2s ease',
          color: '#374151',
          outline: 'none',
          position: 'relative'
        });

        // Add loading animation styles
        if (loadingIcon) {
          loadingIcon.style.animation = 'spin 1s linear infinite';
          const style = document.createElement('style');
          style.textContent = `
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `;
          document.head.appendChild(style);
        }

        // Add hover effects
        button.addEventListener('mouseenter', () => {
          if (!isLocating) {
            Object.assign(button.style, {
              backgroundColor: '#00f5d4',
              color: '#112244',
              transform: 'scale(1.05)',
              boxShadow: '0 4px 12px rgba(0, 245, 212, 0.3)'
            });
          }
        });

        button.addEventListener('mouseleave', () => {
          if (!isLocating) {
            Object.assign(button.style, {
              backgroundColor: 'white',
              color: '#374151',
              transform: 'scale(1)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
            });
          }
        });

        button.addEventListener('focus', () => {
          button.style.boxShadow = '0 0 0 3px rgba(0, 245, 212, 0.3)';
        });

        button.addEventListener('blur', () => {
          button.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
        });

        button.addEventListener('click', (e) => {
          e.preventDefault();
          if (!isLocating) {
            // Show loading state
            if (locationIcon && loadingIcon) {
              locationIcon.style.display = 'none';
              loadingIcon.style.display = 'block';
              button.style.cursor = 'not-allowed';
              button.style.opacity = '0.8';
            }

            // Add click animation
            button.style.transform = 'scale(0.95)';
            setTimeout(() => {
              button.style.transform = 'scale(1)';
            }, 150);

            handleLocateUser();

            // Reset after timeout
            setTimeout(() => {
              if (locationIcon && loadingIcon) {
                locationIcon.style.display = 'block';
                loadingIcon.style.display = 'none';
                button.style.cursor = 'pointer';
                button.style.opacity = '1';
              }
            }, 3000);
          }
        });
      }

      return div;
    };

    locateControl.addTo(map);

    return () => {
      map.removeControl(locateControl);
    };
  }, [map, handleLocateUser, isLocating]);

  return null;
};

const terminalIconSvg = `<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="rgba(0,0,0,0.3)"/>
    </filter>
    <linearGradient id="terminalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#00f5d4;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#00d8b9;stop-opacity:1" />
    </linearGradient>
  </defs>
  <circle cx="16" cy="16" r="14" fill="rgba(0,245,212,0.2)" filter="url(#shadow)" />
  <circle cx="16" cy="16" r="12" fill="white" stroke="url(#terminalGrad)" stroke-width="2" />
  <circle cx="16" cy="16" r="6" fill="url(#terminalGrad)" />
  <path d="M12 16 L14 18 L20 12" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
</svg>`;

const stopIconSvg = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="stopShadow" x="-50%" y="-50%" width="200%" height="200%">
      <feDropShadow dx="0" dy="1" stdDeviation="2" flood-color="rgba(0,0,0,0.2)"/>
    </filter>
  </defs>
  <circle cx="12" cy="12" r="10" fill="rgba(107,114,128,0.2)" filter="url(#stopShadow)" />
  <circle cx="12" cy="12" r="8" fill="white" stroke="#6b7280" stroke-width="1.5" />
  <circle cx="12" cy="12" r="4" fill="#6b7280" />
</svg>`;

const activeStopIconSvg = `<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="activeShadow" x="-50%" y="-50%" width="200%" height="200%">
      <feDropShadow dx="0" dy="3" stdDeviation="4" flood-color="rgba(0,245,212,0.4)"/>
    </filter>
    <linearGradient id="activeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#00f5d4;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#00d8b9;stop-opacity:1" />
    </linearGradient>
  </defs>
  <style>
    .pulse-ring {
      animation: pulseRing 2s infinite;
    }
    @keyframes pulseRing {
      0% { transform: scale(0.8); opacity: 1; }
      50% { transform: scale(1.2); opacity: 0.3; }
      100% { transform: scale(0.8); opacity: 1; }
    }
  </style>
  <circle cx="16" cy="16" r="14" fill="url(#activeGrad)" opacity="0.3" class="pulse-ring" filter="url(#activeShadow)" />
  <circle cx="16" cy="16" r="12" fill="white" stroke="url(#activeGrad)" stroke-width="3" />
  <circle cx="16" cy="16" r="6" fill="url(#activeGrad)" />
  <circle cx="16" cy="16" r="2" fill="white" />
</svg>`;


const terminalIcon = L.divIcon({ html: terminalIconSvg, className: 'bg-transparent', iconSize: [32, 32], iconAnchor: [16, 16] });
const stopIcon = L.divIcon({ html: stopIconSvg, className: 'bg-transparent', iconSize: [24, 24], iconAnchor: [12, 12] });
const activeStopIcon = L.divIcon({ html: activeStopIconSvg, className: 'bg-transparent', iconSize: [32, 32], iconAnchor: [16, 16] });

const lightTileLayer = {
    url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    maxZoom: 19,
    minZoom: 8
};

const darkTileLayer = {
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    maxZoom: 19,
    minZoom: 8
}

interface MapViewProps {
  stops: RouteStop[];
  stopInfos: Map<string, StopInfo>;
  theme: Theme;
  activeStopId: string | null;
  onMarkerClick: (stopId: string) => void;
  showClustering?: boolean;
  maxClusterRadius?: number;
}

const MapView: React.FC<MapViewProps> = ({
  stops,
  stopInfos,
  theme,
  activeStopId,
  onMarkerClick,
  showClustering = true,
  maxClusterRadius = 80
}) => {
  const stripParentheses = (text: string | undefined | null): string => {
    if (!text) return '';
    return text.replace(/\s*\([^)]*\)\s*/g, '').trim();
  };

  const validStops = useMemo(() => {
    return stops
      .map(stop => ({...stop, info: stopInfos.get(stop.stop)}))
      .filter(item => item.info && item.info.lat && item.info.long);
  }, [stops, stopInfos]);


  const positions = useMemo(() => {
    return validStops.map(item => [parseFloat(item.info!.lat), parseFloat(item.info!.long)] as LatLngExpression);
  }, [validStops]);

  const bounds = useMemo(() => {
    if (positions.length < 2) return null;
    return new LatLngBounds(positions as [number, number][]);
  }, [positions]);
  
  const activeStopInfo = useMemo(() => {
      if (!activeStopId) return undefined;
      return stopInfos.get(activeStopId);
  }, [activeStopId, stopInfos]);

  const tileLayer = theme === 'dark' ? darkTileLayer : lightTileLayer;

  // Loading and error state
  const [isMapLoading, setIsMapLoading] = useState(true);
  const [mapError, setMapError] = useState<string | null>(null);

  const handleMapReady = useCallback(() => {
    setIsMapLoading(false);
    setMapError(null);
  }, []);

  const handleMapError = useCallback((error: any) => {
    console.error('Map loading error:', error);
    setIsMapLoading(false);
    setMapError('Failed to load map. Please check your internet connection and try again.');
  }, []);

  if (positions.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800">
        <div className="text-center">
          <div className="text-lg font-medium mb-2">No stop locations available</div>
          <div className="text-sm">Route stops will appear here when available</div>
        </div>
      </div>
    );
  }

  // Performance optimization: limit markers when there are too many
  const shouldLimitMarkers = validStops.length > 50;
  const displayStops = shouldLimitMarkers ? validStops.slice(0, 50) : validStops;

  const renderMarkers = () => {
    return displayStops.map((item, index) => {
      const position: LatLngExpression = [parseFloat(item.info!.lat), parseFloat(item.info!.long)];
      const isTerminal = index === 0 || index === displayStops.length - 1;
      const isActive = item.stop === activeStopId;

      let icon;
      if (isActive) icon = activeStopIcon;
      else if (isTerminal) icon = terminalIcon;
      else icon = stopIcon;

      return (
        <Marker
          key={`marker-${item.stop}-${index}`}
          position={position}
          icon={icon}
          eventHandlers={{
            click: () => onMarkerClick(item.stop)
          }}
          zIndexOffset={isActive ? 1000 : 0}
        >
          <Popup>
            <div className="min-w-[200px]">
              <b className="text-base font-bold block mb-1">{stripParentheses(item.info!.name_tc)}</b>
              <div className="text-sm text-gray-500 mb-2">{stripParentheses(item.info!.name_en)}</div>
              <div className="text-xs text-gray-400">Stop ID: {item.stop}</div>
              {shouldLimitMarkers && index === displayStops.length - 1 && (
                <div className="text-xs text-orange-500 mt-1">
                  Showing first {displayStops.length} of {validStops.length} stops
                </div>
              )}
            </div>
          </Popup>
        </Marker>
      );
    });
  };

  // Show error state if map failed to load
  if (mapError) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800">
        <div className="text-center p-6">
          <div className="text-red-500 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div className="text-lg font-medium mb-2">Map Loading Error</div>
          <div className="text-sm mb-4">{mapError}</div>
          <button
            onClick={() => {
              setMapError(null);
              setIsMapLoading(true);
            }}
            className="px-4 py-2 bg-[#00f5d4] text-[#112244] rounded-lg font-medium hover:bg-[#00d8b9] transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      {isMapLoading && (
        <div className="absolute inset-0 z-10">
          <MapSkeleton className="h-full w-full" />
        </div>
      )}

      <MapContainer
        key={theme} // Force re-render on theme change for tile layer
        center={bounds?.getCenter() ?? positions[0]}
        zoom={14}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%', backgroundColor: theme === 'dark' ? '#1f2937' : '#f9fafb' }}
        whenReady={handleMapReady}
      >
        <TileLayer
          attribution={tileLayer.attribution}
          url={tileLayer.url}
          maxZoom={tileLayer.maxZoom}
          minZoom={tileLayer.minZoom}
          eventHandlers={{
            tileerror: handleMapError
          }}
        />

        {positions.length > 1 && (
          <>
            {/* Shadow/outline for the route */}
            <Polyline
              pathOptions={{
                color: '#000000',
                weight: 8,
                opacity: 0.3,
                lineCap: 'round',
                lineJoin: 'round'
              }}
              positions={positions}
            />
            {/* Main route line */}
            <Polyline
              pathOptions={{
                color: '#00f5d4',
                weight: 5,
                opacity: 0.9,
                lineCap: 'round',
                lineJoin: 'round',
                dashArray: '10, 5'
              }}
              positions={positions}
            />
          </>
        )}

        {renderMarkers()}

        <MapUpdater bounds={bounds} activeStopInfo={activeStopInfo} />
        <MapControls />
      </MapContainer>
    </div>
  );
};

export default MapView;