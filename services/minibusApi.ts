import { cacheManager, CACHE_CONFIGS } from './cacheManager';
import { MinibusRoute, MinibusStop, MinibusEta } from '../types';

const MINIBUS_API_BASE = '/api/minibus';
const REGIONS = ['HKI', 'KLN', 'NT']; // 香港島、九龍、新界

const MINIBUS_CACHE_KEYS = {
  ROUTES: 'minibus_routes',
  ROUTE_DETAILS: (routeId: string) => `minibus_route_details_${routeId}`,
  STOPS: (routeId: string) => `minibus_stops_${routeId}`,
  ETA: (stopId: string, routeId: string) => `minibus_eta_${stopId}_${routeId}`
};

async function fetchMinibusApi<T>(
  endpoint: string,
  cacheKey: string,
  cacheConfig?: { maxAge: number; maxSize?: number }
): Promise<T> {
  const cachedData = cacheManager.get<T>(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  try {
    const response = await fetch(`${MINIBUS_API_BASE}${endpoint}`, {
      headers: { 'Accept': 'application/json' }
    });
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();

    if (cacheConfig) {
      cacheManager.set(cacheKey, data.data, cacheConfig);
    }

    return data.data;
  } catch (error) {
    console.error(`Failed to fetch ${endpoint}:`, error);
    throw error;
  }
}

export const getMinibusRoutes = async (): Promise<MinibusRoute[]> => {
  const cached = cacheManager.get<MinibusRoute[]>(MINIBUS_CACHE_KEYS.ROUTES);
  if (cached) return cached;

  const allRoutes: MinibusRoute[] = [];
  for (const region of REGIONS) {
    try {
      const endpoint = `/route/${region}`;
      const data = await fetchMinibusApi<{ routes: string[] }>(endpoint, `minibus_routes_${region}`, CACHE_CONFIGS.ROUTES);
      
      const routes = data.routes.map((routeCode: string) => ({
        routeId: `${region}_${routeCode}`,
        routeNo: routeCode,
        orig_tc: '',
        orig_en: '',
        dest_tc: '',
        dest_en: '',
        serviceType: ''
      }));
      allRoutes.push(...routes);
    } catch (error) {
      console.error(`Failed to fetch minibus routes for region ${region}:`, error);
    }
  }

  cacheManager.set(MINIBUS_CACHE_KEYS.ROUTES, allRoutes, CACHE_CONFIGS.ROUTES);
  return allRoutes;
};

// Helper to get route details which are needed for stops and ETA
interface RouteDetailResponse {
    route_id: string;
    directions: Array<{
        route_seq: number;
    }>;
}

const getRouteDetails = async (routeId: string): Promise<RouteDetailResponse[]> => {
    const [region, routeCode] = routeId.split('_');
    const cacheKey = MINIBUS_CACHE_KEYS.ROUTE_DETAILS(routeId);
    
    return fetchMinibusApi<RouteDetailResponse[]>(
        `/route/${region}/${routeCode}`,
        cacheKey,
        CACHE_CONFIGS.ROUTE_STOPS
    );
};


export const getMinibusStops = async (routeId: string): Promise<MinibusStop[]> => {
  const cacheKey = MINIBUS_CACHE_KEYS.STOPS(routeId);
  const cached = cacheManager.get<MinibusStop[]>(cacheKey);
  if (cached) return cached;

  try {
    const routeDetails = await getRouteDetails(routeId);
    if (!routeDetails?.[0]?.route_id) {
      console.error('Invalid route data structure:', routeDetails);
      return [];
    }

    const realRouteId = routeDetails[0].route_id;
    const routeSeq = routeDetails[0].directions[0].route_seq;

    const stopListData = await fetchMinibusApi<{ route_stops: any[] }>(
      `/route-stop/${realRouteId}/${routeSeq}`,
      `minibus_route_stops_${realRouteId}_${routeSeq}`,
      CACHE_CONFIGS.ROUTE_STOPS
    );

    if (!stopListData?.route_stops) {
      console.error('Invalid route-stop response:', stopListData);
      return [];
    }

    const stopPromises = stopListData.route_stops.map(async (routeStop: any) => {
      try {
        const stopData = await fetchMinibusApi<{ coordinates: any }>(
          `/stop/${routeStop.stop_id}`,
          `minibus_stop_details_${routeStop.stop_id}`,
          CACHE_CONFIGS.STOPS
        );
        
        if (!stopData?.coordinates?.wgs84) {
          console.warn('Invalid stop data structure:', stopData);
          return null;
        }

        return {
          stopId: routeStop.stop_id.toString(),
          name_tc: routeStop.name_tc || '未知站名',
          name_en: routeStop.name_en || 'Unknown Stop',
          lat: parseFloat(stopData.coordinates.wgs84.latitude) || 0,
          lng: parseFloat(stopData.coordinates.wgs84.longitude) || 0,
        };
      } catch (error) {
        console.error(`Error fetching stop details for stop ${routeStop.stop_id}:`, error);
        return null;
      }
    });

    const stops = (await Promise.all(stopPromises)).filter((s): s is MinibusStop => s !== null);
    
    cacheManager.set(cacheKey, stops, CACHE_CONFIGS.ROUTE_STOPS);
    return stops;
  } catch (error) {
    console.error(`Failed to fetch stops for route ${routeId}:`, error);
    return [];
  }
};

export const getMinibusEta = async (stopId: string, routeId: string): Promise<MinibusEta[]> => {
  const cacheKey = MINIBUS_CACHE_KEYS.ETA(stopId, routeId);
  const cached = cacheManager.get<MinibusEta[]>(cacheKey);
  if (cached) return cached;

  try {
    const routeDetails = await getRouteDetails(routeId);
    if (!routeDetails?.[0]?.route_id) {
      console.error('Invalid route data structure:', routeDetails);
      return [];
    }
    
    const realRouteId = routeDetails[0].route_id;
    const routeSeq = routeDetails[0].directions[0].route_seq;

    const stopListData = await fetchMinibusApi<{ route_stops: any[] }>(
      `/route-stop/${realRouteId}/${routeSeq}`,
      `minibus_route_stops_${realRouteId}_${routeSeq}`,
      CACHE_CONFIGS.ROUTE_STOPS
    );

    const stopInfo = stopListData.route_stops.find(
      (stop: any) => stop.stop_id.toString() === stopId
    );

    if (!stopInfo) {
      console.error(`Stop ${stopId} not found in route ${routeId}`);
      return [];
    }

    const etaData = await fetchMinibusApi<{ enabled: boolean; eta: any[] }>(
      `/eta/route-stop/${realRouteId}/${routeSeq}/${stopInfo.stop_seq}`,
      `minibus_eta_${realRouteId}_${routeSeq}_${stopInfo.stop_seq}`,
      CACHE_CONFIGS.ETA
    );

    if (!etaData?.enabled) {
      console.warn('ETA service not enabled for this stop');
      return [];
    }

    const etas: MinibusEta[] = (etaData.eta || []).map((etaItem: any) => ({
      eta: etaItem.timestamp,
      remark_tc: etaItem.remarks_tc || '',
      remark_en: etaItem.remarks_en || ''
    }));

    cacheManager.set(cacheKey, etas, CACHE_CONFIGS.ETA);
    return etas;
  } catch (error) {
    console.error(`Failed to fetch ETAs for stop ${stopId} route ${routeId}:`, error);
    return [];
  }
};

export const preloadMinibusData = async () => {
  await getMinibusRoutes();
};