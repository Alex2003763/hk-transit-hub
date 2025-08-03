import { cacheManager, CACHE_CONFIGS } from './cacheManager';

const MINIBUS_API_BASE = '/api/minibus';
const REGIONS = ['HKI', 'KLN', 'NT']; // 香港島、九龍、新界

interface MinibusRoute {
  routeId: string;
  routeNo: string;
  orig_tc: string;
  orig_en: string;
  dest_tc: string;
  dest_en: string;
  serviceType: string;
}

interface MinibusStop {
  stopId: string;
  name_tc: string;
  name_en: string;
  lat: number;
  lng: number;
}

interface MinibusEta {
  eta: string;
  remark_tc: string;
  remark_en: string;
}

const MINIBUS_CACHE_KEYS = {
  ROUTES: 'minibus_routes',
  STOPS: (routeId: string) => `minibus_stops_${routeId}`,
  ETA: (stopId: string, routeId: string) => `minibus_eta_${stopId}_${routeId}`
};

export const getMinibusRoutes = async (): Promise<MinibusRoute[]> => {
  // 先尝试从缓存获取
  const cached = cacheManager.get<MinibusRoute[]>(MINIBUS_CACHE_KEYS.ROUTES);
  if (cached) return cached;
  
  // 缓存未命中则获取数据
  const allRoutes: MinibusRoute[] = [];
  
  for (const region of REGIONS) {
    try {
      const response = await fetch(`${MINIBUS_API_BASE}/route/${region}`, {
        headers: {
          'Accept': 'application/json'
        }
      });
      const data = await response.json();
      
      const routes = data.data.routes.map((routeCode: string) => ({
        routeId: `${region}_${routeCode}`, // Create a unique ID
        routeNo: routeCode,
        orig_tc: '', // Will be fetched in getMinibusStops
        orig_en: '',
        dest_tc: '',
        dest_en: '',
        serviceType: '' // Will be fetched in getMinibusStops
      }));
      
      allRoutes.push(...routes);
    } catch (error) {
      console.error(`Failed to fetch minibus routes for region ${region}:`, error);
    }
  }
  
  // 设置缓存
  cacheManager.set(
    MINIBUS_CACHE_KEYS.ROUTES,
    allRoutes,
    { maxAge: 24 * 60 * 60 * 1000 } // 缓存24小时
  );
  
  return allRoutes;
};

export const getMinibusStops = async (routeId: string): Promise<MinibusStop[]> => {
  const cacheKey = MINIBUS_CACHE_KEYS.STOPS(routeId);
  const cached = cacheManager.get<MinibusStop[]>(cacheKey);
  if (cached) return cached;

  const [region, routeCode] = routeId.split('_');
  try {
    // 1. 先獲取路線詳細信息以獲取 route_id 和 route_seq
    const routeResponse = await fetch(`${MINIBUS_API_BASE}/route/${region}/${routeCode}`, {
      headers: {
        'Accept': 'application/json'
      }
    });
    const routeData = await routeResponse.json();

    if (!routeData?.data?.[0]?.route_id) {
      console.error('Invalid route data structure:', routeData);
      return [];
    }

    const realRouteId = routeData.data[0].route_id;
    const routeSeq = routeData.data[0].directions[0].route_seq;

    // 2. 使用 route-stop API 獲取站點列表
    const stopListResponse = await fetch(`${MINIBUS_API_BASE}/route-stop/${realRouteId}/${routeSeq}`, {
      headers: {
        'Accept': 'application/json'
      }
    });
    const stopListData = await stopListResponse.json();

    if (!stopListData?.data?.route_stops || !Array.isArray(stopListData.data.route_stops)) {
      console.error('Invalid route-stop response:', stopListData);
      return [];
    }

    // 3. 處理每個站點
    const stops: MinibusStop[] = [];
    for (const routeStop of stopListData.data.route_stops) {
      try {
        // 獲取站點詳細信息
        const stopResponse = await fetch(`${MINIBUS_API_BASE}/stop/${routeStop.stop_id}`, {
          headers: {
            'Accept': 'application/json'
          }
        });
        const stopData = await stopResponse.json();

        if (!stopData?.data?.coordinates?.wgs84) {
          console.warn('Invalid stop data structure:', stopData);
          continue;
        }

        stops.push({
          stopId: routeStop.stop_id.toString(),
          name_tc: routeStop.name_tc || '未知站名',
          name_en: routeStop.name_en || 'Unknown Stop',
          lat: parseFloat(stopData.data.coordinates.wgs84.latitude) || 0,
          lng: parseFloat(stopData.data.coordinates.wgs84.longitude) || 0,
        });
      } catch (error) {
        console.error(`Error fetching stop details for stop ${routeStop.stop_id}:`, error);
      }
    }

    if (stops.length === 0) {
      console.warn(`No valid stops found for route ${routeId}`);
    } else {
      console.log(`Successfully processed ${stops.length} stops for route ${routeId}`);
    }

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

  const [region, routeCode] = routeId.split('_');
  try {
    // 1. 首先獲取路線詳細信息
    const routeResponse = await fetch(`${MINIBUS_API_BASE}/route/${region}/${routeCode}`, {
      headers: { 'Accept': 'application/json' }
    });
    const routeData = await routeResponse.json();

    if (!routeData?.data?.[0]?.route_id) {
      console.error('Invalid route data structure:', routeData);
      return [];
    }

    const realRouteId = routeData.data[0].route_id;
    const routeSeq = routeData.data[0].directions[0].route_seq;

    // 2. 獲取站點序號
    const stopListResponse = await fetch(
      `${MINIBUS_API_BASE}/route-stop/${realRouteId}/${routeSeq}`,
      { headers: { 'Accept': 'application/json' } }
    );
    const stopListData = await stopListResponse.json();

    if (!stopListData?.data?.route_stops) {
      console.error('Invalid route-stop response:', stopListData);
      return [];
    }

    // 查找指定站點的序號
    const stopInfo = stopListData.data.route_stops.find(
      (stop: any) => stop.stop_id.toString() === stopId
    );

    if (!stopInfo) {
      console.error(`Stop ${stopId} not found in route ${routeId}`);
      return [];
    }

    // 3. 使用正確的端點獲取到站時間
    const etaResponse = await fetch(
      `${MINIBUS_API_BASE}/eta/route-stop/${realRouteId}/${routeSeq}/${stopInfo.stop_seq}`,
      { headers: { 'Accept': 'application/json' } }
    );
    const etaData = await etaResponse.json();

    if (!etaData?.data?.enabled) {
      console.warn('ETA service not enabled for this stop');
      return [];
    }

    const etas: MinibusEta[] = (etaData.data.eta || []).map((etaItem: any) => ({
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
  // 预加载关键小巴数据
  await getMinibusRoutes();
};