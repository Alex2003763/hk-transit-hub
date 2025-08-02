
import { ApiResponse, Route, Stop, RouteStop, Eta } from '../types';

// Use proxy in development, direct API in production
const BASE_URL = import.meta.env.DEV
  ? '/api/kmb'
  : 'https://data.etabus.gov.hk/v1/transport/kmb';

async function fetchKmbApi<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${BASE_URL}${endpoint}`);
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }
  const jsonResponse: ApiResponse<T> = await response.json();
  return jsonResponse.data;
}

export const getRouteList = (): Promise<Route[]> => {
  return fetchKmbApi<Route[]>('/route/');
};

export const getAllStops = (): Promise<Stop[]> => {
  return fetchKmbApi<Stop[]>('/stop');
};

export const getRouteStops = (route: string, direction: 'inbound' | 'outbound', serviceType: string): Promise<RouteStop[]> => {
  return fetchKmbApi<RouteStop[]>(`/route-stop/${route}/${direction}/${serviceType}`);
};

export const getStopEta = (stopId: string, route: string, serviceType: string): Promise<Eta[]> => {
  return fetchKmbApi<Eta[]>(`/eta/${stopId}/${route}/${serviceType}`);
};
