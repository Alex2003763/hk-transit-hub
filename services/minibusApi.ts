import { cacheManager, CACHE_CONFIGS } from './cacheManager';
import { MinibusRoute, MinibusRouteVariant, MinibusDirection } from '../types';

const MINIBUS_API_BASE = '/api/minibus';
const REGIONS = ['HKI', 'KLN', 'NT']; // 香港島、九龍、新界

// 使用從types.ts導入的MinibusRoute接口

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
  
  try {
    // 1. 首先獲取所有路線列表（不分區域）
    const routeListResponse = await fetch(`${MINIBUS_API_BASE}/route`, {
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (!routeListResponse.ok) {
      throw new Error(`HTTP error! status: ${routeListResponse.status}`);
    }
    
    const routeListData = await routeListResponse.json();
    
    // 檢查數據結構
    if (!routeListData || !routeListData.data || !routeListData.data.routes) {
      console.warn(`Invalid route list data structure:`, routeListData);
      return [];
    }
    
    // 2. 處理所有區域的路線
    const regions = ['HKI', 'KLN', 'NT'];
    const routePromises: Promise<MinibusRoute[]>[] = [];
    
    for (const region of regions) {
      if (Array.isArray(routeListData.data.routes[region])) {
        const regionRoutes = routeListData.data.routes[region];
        console.log(`Found ${regionRoutes.length} routes in region ${region}`);
        
        // 並行獲取該區域所有路線的詳細信息
        const regionRoutePromises = regionRoutes.map(async (routeCode: string) => {
          try {
            const routeResponse = await fetch(`${MINIBUS_API_BASE}/route/${region}/${routeCode}`, {
              headers: {
                'Accept': 'application/json'
              }
            });
            
            if (!routeResponse.ok) {
              throw new Error(`HTTP error! status: ${routeResponse.status}`);
            }
            
            const routeData = await routeResponse.json();
            
            // 從響應中提取路線信息
            if (routeData.data && routeData.data.length > 0) {
              // 使用第一個變體的資訊作為主要信息
              const firstVariant = routeData.data[0];
              const direction = firstVariant.directions && firstVariant.directions.length > 0 ? firstVariant.directions[0] : null;
              
              if (direction) {
                return {
                  routeId: `${region}_${routeCode}`,
                  routeNo: routeCode,
                  orig_tc: direction.orig_tc || '',
                  orig_en: direction.orig_en || '',
                  dest_tc: direction.dest_tc || '',
                  dest_en: direction.dest_en || '',
                  serviceType: firstVariant.route_id?.toString() || '',
                  variants: routeData.data
                };
              }
            }
            return null;
          } catch (routeError) {
            console.error(`Failed to fetch minibus route details for ${region}/${routeCode}:`, routeError);
            return null;
          }
        });
        
        routePromises.push(Promise.all(regionRoutePromises).then(results =>
          results.filter((route) => route !== null) as MinibusRoute[]
        ));
      }
    }
    
    // 等待所有區域的路線處理完成
    const regionResults = await Promise.all(routePromises);
    
    // 合併所有結果
    for (const regionRoutes of regionResults) {
      allRoutes.push(...regionRoutes);
    }
    
    console.log(`Successfully loaded ${allRoutes.length} minibus routes`);
  } catch (error) {
    console.error('Failed to fetch minibus routes:', error);
  }
  
  // 设置缓存
  cacheManager.set(
    MINIBUS_CACHE_KEYS.ROUTES,
    allRoutes,
    { maxAge: 24 * 60 * 60 * 1000 } // 缓存24小时
  );
  
  return allRoutes;
};

export const getMinibusStops = async (routeId: string, variantIndex: number = 0, directionIndex: number = 0): Promise<MinibusStop[]> => {
  const cacheKey = `${MINIBUS_CACHE_KEYS.STOPS(routeId)}_${variantIndex}_${directionIndex}`;
  const cached = cacheManager.get<MinibusStop[]>(cacheKey);
  if (cached) return cached;

  const [region, routeCode] = routeId.split('_');
  try {
    // 1. 先獲取路線詳細信息
    const routeResponse = await fetch(`${MINIBUS_API_BASE}/route/${region}/${routeCode}`, {
      headers: {
        'Accept': 'application/json'
      }
    });
    const routeData = await routeResponse.json();

    if (!routeData?.data || !Array.isArray(routeData.data) || routeData.data.length === 0) {
      console.error('Invalid route data structure:', routeData);
      return [];
    }

    // 獲取指定的變體
    const variant = routeData.data[variantIndex];
    if (!variant) {
      console.error(`Variant ${variantIndex} not found for route ${routeId}`);
      return [];
    }

    // 獲取指定的方向
    const direction = variant.directions[directionIndex];
    if (!direction) {
      console.error(`Direction ${directionIndex} not found for variant ${variantIndex} of route ${routeId}`);
      return [];
    }

    const realRouteId = variant.route_id;
    const routeSeq = direction.route_seq;

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
      console.warn(`No valid stops found for route ${routeId}, variant ${variantIndex}, direction ${directionIndex}`);
    } else {
      console.log(`Successfully processed ${stops.length} stops for route ${routeId}, variant ${variantIndex}, direction ${directionIndex}`);
    }

    cacheManager.set(cacheKey, stops, CACHE_CONFIGS.ROUTE_STOPS);
    return stops;
  } catch (error) {
    console.error(`Failed to fetch stops for route ${routeId}, variant ${variantIndex}, direction ${directionIndex}:`, error);
    return [];
  }
};

export const getMinibusEta = async (stopId: string, routeId: string, variantIndex: number = 0, directionIndex: number = 0): Promise<MinibusEta[]> => {
  const cacheKey = `${MINIBUS_CACHE_KEYS.ETA(stopId, routeId)}_${variantIndex}_${directionIndex}`;
  const cached = cacheManager.get<MinibusEta[]>(cacheKey);
  if (cached) return cached;

  const [region, routeCode] = routeId.split('_');
  try {
    // 1. 首先獲取路線詳細信息
    const routeResponse = await fetch(`${MINIBUS_API_BASE}/route/${region}/${routeCode}`, {
      headers: { 'Accept': 'application/json' }
    });
    const routeData = await routeResponse.json();

    if (!routeData?.data || !Array.isArray(routeData.data) || routeData.data.length === 0) {
      console.error('Invalid route data structure:', routeData);
      return [];
    }

    // 獲取指定的變體
    const variant = routeData.data[variantIndex];
    if (!variant) {
      console.error(`Variant ${variantIndex} not found for route ${routeId}`);
      return [];
    }

    // 獲取指定的方向
    const direction = variant.directions[directionIndex];
    if (!direction) {
      console.error(`Direction ${directionIndex} not found for variant ${variantIndex} of route ${routeId}`);
      return [];
    }

    const realRouteId = variant.route_id;
    const routeSeq = direction.route_seq;

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
      console.error(`Stop ${stopId} not found in route ${routeId}, variant ${variantIndex}, direction ${directionIndex}`);
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
    console.error(`Failed to fetch ETAs for stop ${stopId} route ${routeId}, variant ${variantIndex}, direction ${directionIndex}:`, error);
    return [];
  }
};