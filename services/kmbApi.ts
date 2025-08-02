
import { ApiResponse, Route, Stop, RouteStop, Eta } from '../types';
import { cacheManager, CACHE_CONFIGS } from './cacheManager';

// Use proxy in development, direct API in production
const BASE_URL = import.meta.env.DEV
  ? '/api/kmb'
  : 'https://data.etabus.gov.hk/v1/transport/kmb';

async function fetchKmbApi<T>(endpoint: string, cacheConfig?: { maxAge: number; maxSize: number }): Promise<T> {
  const cacheKey = `kmb:${endpoint}`;

  // Try to get from cache first
  const cachedData = cacheManager.get<T>(cacheKey);
  if (cachedData) {
    console.log(`Cache hit for ${endpoint}`);
    return cachedData;
  }

  console.log(`Cache miss for ${endpoint}, fetching from API`);

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`);
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }
    const jsonResponse: ApiResponse<T> = await response.json();

    // Cache the result
    if (cacheConfig) {
      cacheManager.set(cacheKey, jsonResponse.data, cacheConfig);
    }

    return jsonResponse.data;
  } catch (error) {
    console.error(`Failed to fetch ${endpoint}:`, error);
    throw error;
  }
}

export const getRouteList = (): Promise<Route[]> => {
  return fetchKmbApi<Route[]>('/route/', CACHE_CONFIGS.ROUTES);
};

export const getAllStops = (): Promise<Stop[]> => {
  return fetchKmbApi<Stop[]>('/stop', CACHE_CONFIGS.STOPS);
};

export const getRouteStops = (route: string, direction: 'inbound' | 'outbound', serviceType: string): Promise<RouteStop[]> => {
  return fetchKmbApi<RouteStop[]>(`/route-stop/${route}/${direction}/${serviceType}`, CACHE_CONFIGS.ROUTE_STOPS);
};

export const getStopEta = (stopId: string, route: string, serviceType: string): Promise<Eta[]> => {
  return fetchKmbApi<Eta[]>(`/eta/${stopId}/${route}/${serviceType}`, CACHE_CONFIGS.ETA);
};

// Cache management functions
export const clearApiCache = (): void => {
  cacheManager.clear();
  console.log('API cache cleared');
};

export const getApiCacheStats = () => {
  return cacheManager.getStats();
};

// Preload critical data
export const preloadCriticalData = async (): Promise<void> => {
  try {
    console.log('Preloading critical data...');
    await Promise.all([
      getRouteList(),
      getAllStops()
    ]);
    console.log('Critical data preloaded successfully');
  } catch (error) {
    console.error('Failed to preload critical data:', error);
  }
};
