import React, { useMemo, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L, { LatLngExpression, LatLngBounds } from 'leaflet';
import { RouteStop, StopInfo } from '../types';

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

const terminalIconSvg = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-6 h-6">
  <circle cx="12" cy="12" r="10" class="text-teal-500/30 fill-current" />
  <circle cx="12" cy="12" r="8" class="text-white fill-current" />
  <circle cx="12" cy="12" r="4" class="text-teal-500 fill-current" />
</svg>`;

const stopIconSvg = `<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-4 h-4">
  <circle cx="8" cy="8" r="7" class="text-gray-500/30 fill-current" />
  <circle cx="8" cy="8" r="6" class="text-white fill-current" />
  <circle cx="8" cy="8" r="3" class="text-gray-500 fill-current" />
</svg>`;

const activeStopIconSvg = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <style>
    .pulse {
      animation: pulse 1.5s infinite;
    }
    @keyframes pulse {
      0% { transform: scale(0.9); opacity: 0.7; }
      50% { transform: scale(1.1); opacity: 1; }
      100% { transform: scale(0.9); opacity: 0.7; }
    }
  </style>
  <circle cx="12" cy="12" r="11" class="text-[color:var(--accent)] fill-current opacity-30 pulse" />
  <circle cx="12" cy="12" r="8" stroke-width="2" class="text-white fill-current" />
  <circle cx="12" cy="12" r="5" class="text-[color:var(--accent)] fill-current" />
</svg>`;


const terminalIcon = L.divIcon({ html: terminalIconSvg, className: 'bg-transparent', iconSize: [24, 24], iconAnchor: [12, 12] });
const stopIcon = L.divIcon({ html: stopIconSvg, className: 'bg-transparent', iconSize: [16, 16], iconAnchor: [8, 8] });
const activeStopIcon = L.divIcon({ html: activeStopIconSvg, className: 'bg-transparent', iconSize: [24, 24], iconAnchor: [12, 12] });

const lightTileLayer = {
    url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
};

const darkTileLayer = {
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
}

interface MapViewProps {
  stops: RouteStop[];
  stopInfos: Map<string, StopInfo>;
  theme: Theme;
  activeStopId: string | null;
  onMarkerClick: (stopId: string) => void;
}

const MapView: React.FC<MapViewProps> = ({ stops, stopInfos, theme, activeStopId, onMarkerClick }) => {
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

  if (positions.length === 0) {
    return <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800">No stop locations to display on map.</div>;
  }

  return (
      <MapContainer
        key={theme} // Force re-render on theme change for tile layer
        center={bounds?.getCenter() ?? positions[0]}
        zoom={14}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%', backgroundColor: theme === 'dark' ? '#1f2937' : '#f9fafb' }}
      >
        <TileLayer
          attribution={tileLayer.attribution}
          url={tileLayer.url}
        />
        
        {positions.length > 1 && <Polyline pathOptions={{ color: '#00f5d4', weight: 5, opacity: 0.8 }} positions={positions} />}

        {validStops.map((item, index) => {
          const position: LatLngExpression = [parseFloat(item.info!.lat), parseFloat(item.info!.long)];
          const isTerminal = index === 0 || index === validStops.length - 1;
          const isActive = item.stop === activeStopId;

          let icon;
          if (isActive) icon = activeStopIcon;
          else if (isTerminal) icon = terminalIcon;
          else icon = stopIcon;

          return (
            <Marker 
              key={item.stop} 
              position={position} 
              icon={icon}
              eventHandlers={{
                click: () => onMarkerClick(item.stop)
              }}
              zIndexOffset={isActive ? 1000 : 0}
            >
              <Popup>
                <b className="text-base font-bold">{stripParentheses(item.info!.name_tc)}</b>
                <div className="text-sm text-gray-500">{stripParentheses(item.info!.name_en)}</div>
              </Popup>
            </Marker>
          );
        })}

        <MapUpdater bounds={bounds} activeStopInfo={activeStopInfo} />
      </MapContainer>
  );
};

export default MapView;