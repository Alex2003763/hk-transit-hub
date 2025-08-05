import React, { useState, useEffect } from 'react';
import Loader from './Loader';
import ErrorDisplay from './ErrorDisplay';
import { geolocationService, LocationCoordinates } from '../services/geolocationService';
import { getWeatherIcon } from '../utils/weatherIcons';

interface WeatherWarning {
  contents: string[];
  warningStatementCode: string;
  updateTime: string;
}

interface RainfallData {
  place: string;
  max: number;
}

interface TemperatureData {
  place: string;
  value: number;
  unit: string;
}

interface WeatherData {
  warnings: WeatherWarning[];
  rainfall: RainfallData[];
  temperatures: TemperatureData[];
  warningMessages: string[];
  icon: number[];
}

const WeatherDisplay: React.FC = () => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<LocationCoordinates | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [selectedStation, setSelectedStation] = useState<string>('closest');
  const [expandedWarning, setExpandedWarning] = useState<number | null>(null);

  // 動態背景色判斷
  const getWeatherBgClass = (iconNum?: number) => {
    if (!iconNum) return "from-blue-100 to-blue-200 dark:from-gray-800 dark:to-gray-900";
    if ([50, 51, 52, 53, 54].includes(iconNum)) return "from-yellow-200 to-yellow-400 dark:from-yellow-900 dark:to-yellow-700"; // 晴
    if ([60, 61, 62, 63, 64].includes(iconNum)) return "from-gray-300 to-gray-500 dark:from-gray-900 dark:to-gray-700"; // 多雲
    if ([70, 71, 72, 73, 74, 75].includes(iconNum)) return "from-blue-300 to-blue-600 dark:from-blue-900 dark:to-blue-700"; // 雨
    if ([80, 81, 82].includes(iconNum)) return "from-purple-300 to-purple-600 dark:from-purple-900 dark:to-purple-700"; // 雷暴
    return "from-blue-100 to-blue-200 dark:from-gray-800 dark:to-gray-900";
  };

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    const fetchWeatherData = async () => {
      try {
        setLoading(true);
        const [warningRes, rhrreadRes] = await Promise.all([
          fetch('https://data.weather.gov.hk/weatherAPI/opendata/weather.php?dataType=warningInfo&lang=tc'),
          fetch('https://data.weather.gov.hk/weatherAPI/opendata/weather.php?dataType=rhrread&lang=tc')
        ]);

        if (!warningRes.ok || !rhrreadRes.ok) {
          throw new Error('Failed to fetch weather data');
        }

        const warningData = await warningRes.json();
        const rhrreadData = await rhrreadRes.json();

        const warnings: WeatherWarning[] = warningData.details || [];
        const rainfall: RainfallData[] = rhrreadData.rainfall?.data || [];
        const temperatures: TemperatureData[] = rhrreadData.temperature?.data || [];
        const warningMessages = rhrreadData.warningMessage || [];
        const icon = rhrreadData.icon || [];

        setWeather({
          warnings,
          rainfall,
          temperatures,
          warningMessages,
          icon,
        });
        setError(null);
      } catch (err) {
        console.error('Error fetching weather:', err);
        setError('無法加載天氣資訊，請稍後再試。');
      } finally {
        setLoading(false);
      }
    };

    const fetchUserLocation = async () => {
      try {
        const location = await geolocationService.getCurrentLocation({
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 600000,
        });
        setUserLocation(location.coordinates);
      } catch (err) {
        console.error("Error getting user location:", err);
      }
    };

    fetchWeatherData();
    fetchUserLocation();

    // 自動刷新，每 5 分鐘
    intervalId = setInterval(fetchWeatherData, 300000);

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  const findClosestStation = (): TemperatureData | null => {
    if (!userLocation || !weather?.temperatures) return null;

    // A very simplified mapping of districts to weather stations
    // A proper implementation would use actual coordinates for stations
    const stationCoords: { [key: string]: { lat: number, lon: number } } = {
      '京士柏': { lat: 22.31, lon: 114.17 },
      '香港天文台': { lat: 22.30, lon: 114.17 },
      '黃竹坑': { lat: 22.25, lon: 114.17 },
      '打鼓嶺': { lat: 22.53, lon: 114.15 },
      '流浮山': { lat: 22.47, lon: 113.98 },
      '大埔': { lat: 22.45, lon: 114.17 },
      '沙田': { lat: 22.38, lon: 114.19 },
      '屯門': { lat: 22.39, lon: 113.97 },
      '將軍澳': { lat: 22.31, lon: 114.26 },
      '西貢': { lat: 22.38, lon: 114.27 },
      '長洲': { lat: 22.21, lon: 114.03 },
      '赤鱲角': { lat: 22.31, lon: 113.93 },
      '青衣': { lat: 22.35, lon: 114.10 },
      '石崗': { lat: 22.43, lon: 114.08 },
      '荃灣可觀': { lat: 22.38, lon: 114.11 },
      '香港公園': { lat: 22.28, lon: 114.16 },
      '筲箕灣': { lat: 22.28, lon: 114.23 },
      '九龍城': { lat: 22.33, lon: 114.19 },
      '黃大仙': { lat: 22.34, lon: 114.20 },
      '赤柱': { lat: 22.22, lon: 114.21 },
      '觀塘': { lat: 22.31, lon: 114.22 },
      '深水埗': { lat: 22.33, lon: 114.16 },
      '啟德跑道公園': { lat: 22.31, lon: 114.21 },
      '元朗公園': { lat: 22.44, lon: 114.02 },
      '大美督': { lat: 22.47, lon: 114.22 },
    };

    let closestStation: TemperatureData | null = null;
    let minDistance = Infinity;

    weather.temperatures.forEach(station => {
      const stationCoord = stationCoords[station.place];
      if (stationCoord) {
        const distance = Math.sqrt(
          Math.pow(userLocation.lat - stationCoord.lat, 2) +
          Math.pow(userLocation.lng - stationCoord.lon, 2)
        );
        if (distance < minDistance) {
          minDistance = distance;
          closestStation = station;
        }
      }
    });

    return closestStation;
  };

  if (loading) {
    return <Loader message="正在加載天氣資訊..." />;
  }

  if (error) {
    return <ErrorDisplay message={error} />;
  }

  if (!weather) {
    return null;
  }

  const closestStation = findClosestStation();
  const displayTemperature = selectedStation === 'closest'
    ? (closestStation || weather.temperatures.find(t => t.place === '香港天文台'))
    : weather.temperatures.find(t => t.place === selectedStation);

  return (
    <div
      className={`bg-gradient-to-br ${getWeatherBgClass(weather?.icon?.[0])} p-6 sm:p-8 rounded-3xl shadow-2xl mb-8 border border-teal-200 dark:border-teal-700 transition-all duration-300 backdrop-blur-xl hover:shadow-3xl hover:scale-[1.01] hover:border-teal-400 dark:hover:border-teal-400`}
      role="region"
      aria-label="天氣資訊"
      tabIndex={0}
    >
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
        <div className="flex items-center gap-4">
          {weather.icon.length > 0 && (
            <img
              src={getWeatherIcon(weather.icon)}
              alt="天氣圖示"
              aria-label="天氣圖示"
              className="w-16 h-16 md:w-20 md:h-20 animate-float"
              style={{ animation: 'float 2.5s ease-in-out infinite' }}
            />
          )}
          <div>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-gray-800 dark:text-white">
              {selectedStation === 'closest'
                ? (closestStation ? `您附近 (${closestStation.place}) 的天氣` : '香港天氣')
                : `${selectedStation} 的天氣`}
            </h3>
            {/* 天氣描述（如晴、雨） */}
            <p className="text-lg text-gray-600 dark:text-gray-300 mt-1">
              {weather.warningMessages.length > 0
                ? weather.warningMessages[0]
                : '天氣良好'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              value={selectedStation}
              onChange={(e) => setSelectedStation(e.target.value)}
              className="text-sm bg-white dark:bg-gray-700 rounded-lg py-2 pl-3 pr-8 appearance-none border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
            >
              <option value="closest">最接近</option>
              {weather.temperatures.map(t => (
                <option key={t.place} value={t.place}>{t.place}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
              <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          {/* 即時更新按鈕已移除 */}
        </div>
      </div>

      {locationError && !userLocation && (
        <p className="text-sm text-yellow-600 dark:text-yellow-400 mb-2">{locationError}</p>
      )}

      {weather.warningMessages.length > 0 && (
        <div className="mb-4 p-3 bg-yellow-100 dark:bg-yellow-900/50 border-l-4 border-yellow-500 rounded-md">
          {weather.warningMessages.map((msg, index) => (
            <p key={index} className="text-sm font-semibold text-yellow-800 dark:text-yellow-200">{msg}</p>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center mt-2">
        {displayTemperature && (
          <section className="bg-gradient-to-br from-teal-50/80 via-white/70 to-teal-100/80 dark:from-gray-900/80 dark:via-gray-800/70 dark:to-gray-900/80 p-4 sm:p-6 rounded-3xl shadow-2xl flex flex-col items-center border border-teal-100 dark:border-teal-700 transition-all duration-300 backdrop-blur-md hover:shadow-3xl hover:scale-105 hover:border-teal-400 dark:hover:border-teal-400" aria-label="溫度資訊">
            <svg className="w-8 h-8 text-red-400 mb-2 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2a7 7 0 017 7c0 3.87-3.13 7-7 7s-7-3.13-7-7a7 7 0 017-7z" />
            </svg>
            <p className="text-base font-semibold text-gray-700 dark:text-gray-300">溫度</p>
            <p className="text-3xl font-extrabold text-gray-900 dark:text-white drop-shadow">
              {displayTemperature.value}°<span className="text-lg">{displayTemperature.unit}</span>
            </p>
          </section>
        )}
        {/* 濕度卡片 */}
        {weather.rainfall.length > 0 && (
          <section className="bg-gradient-to-br from-teal-50/80 via-white/70 to-teal-100/80 dark:from-gray-900/80 dark:via-gray-800/70 dark:to-gray-900/80 p-4 sm:p-6 rounded-3xl shadow-2xl flex flex-col items-center border border-teal-100 dark:border-teal-700 transition-all duration-300 backdrop-blur-md hover:shadow-3xl hover:scale-105 hover:border-teal-400 dark:hover:border-teal-400" aria-label="降雨量資訊">
            <svg className="w-8 h-8 text-blue-400 mb-2 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 13v-4a4 4 0 10-8 0v4a4 4 0 008 0z" />
            </svg>
            <p className="text-base font-semibold text-gray-700 dark:text-gray-300">降雨量</p>
            <p className="text-2xl font-extrabold text-gray-900 dark:text-white drop-shadow">
              {weather.rainfall[0].max} mm
            </p>
            <span className="text-xs text-gray-500 dark:text-gray-400">{weather.rainfall[0].place}</span>
          </section>
        )}
        {/* 其他可加濕度、風速等卡片 */}
      </div>

      {weather.warnings.length > 0 && (
        <div className="mt-6">
          <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-4 text-lg">天氣警告</h4>
          <div className="space-y-3">
            {weather.warnings.map((warning, index) => {
              const warningIconMap: Record<string, string> = {
                WFIREY: 'https://www.hko.gov.hk/tc/wxinfo/dailywx/images/firey.gif',
                WFIRER: 'https://www.hko.gov.hk/tc/wxinfo/dailywx/images/firer.gif',
                WFROST: 'https://www.hko.gov.hk/tc/wxinfo/dailywx/images/frost.gif',
                WHOT: 'https://www.hko.gov.hk/tc/wxinfo/dailywx/images/vhot.gif',
                WCOLD: 'https://www.hko.gov.hk/tc/wxinfo/dailywx/images/cold.gif',
                WMSGNL: 'https://www.hko.gov.hk/tc/wxinfo/dailywx/images/sms.gif',
                WRAINA: 'https://www.hko.gov.hk/tc/wxinfo/dailywx/images/raina.gif',
                WRAINR: 'https://www.hko.gov.hk/tc/wxinfo/dailywx/images/rainr.gif',
                WRAINB: 'https://www.hko.gov.hk/tc/wxinfo/dailywx/images/rainb.gif',
                WFNTSA: 'https://www.hko.gov.hk/tc/wxinfo/dailywx/images/ntfl.gif',
                WL: 'https://www.hko.gov.hk/tc/wxinfo/dailywx/images/landslip.gif',
                TC1: 'https://www.hko.gov.hk/tc/wxinfo/dailywx/images/tc1.gif',
                TC3: 'https://www.hko.gov.hk/tc/wxinfo/dailywx/images/tc3.gif',
                TC8NE: 'https://www.hko.gov.hk/tc/wxinfo/dailywx/images/tc8ne.gif',
                TC8SE: 'https://www.hko.gov.hk/tc/wxinfo/dailywx/images/tc8b.gif',
                TC8NW: 'https://www.hko.gov.hk/tc/wxinfo/dailywx/images/tc8d.gif',
                TC8SW: 'https://www.hko.gov.hk/tc/wxinfo/dailywx/images/tc8c.gif',
                TC9: 'https://www.hko.gov.hk/tc/wxinfo/dailywx/images/tc9.gif',
                TC10: 'https://www.hko.gov.hk/tc/wxinfo/dailywx/images/tc10.gif',
                WTMW: 'https://www.hko.gov.hk/tc/wxinfo/dailywx/images/tsunami-warn.gif',
                WTS: 'https://www.hko.gov.hk/tc/wxinfo/dailywx/images/ts.gif',
              };
              const subtype = (warning as any).subtype || warning.warningStatementCode;
              const iconUrl = warningIconMap[subtype] || '';
              const isExpanded = expandedWarning === index;
              return (
                <div
                  key={index}
                  className={`bg-yellow-50 dark:bg-yellow-900/40 border-l-4 border-yellow-400 rounded-xl shadow p-4 flex items-center transition-all duration-200 cursor-pointer hover:shadow-lg hover:bg-yellow-100/80 dark:hover:bg-yellow-900/60`}
                  onClick={() => setExpandedWarning(isExpanded ? null : index)}
                  tabIndex={0}
                  aria-expanded={isExpanded}
                  aria-label={`天氣警告 ${index + 1}`}
                >
                  {iconUrl && (
                    <img
                      src={iconUrl}
                      alt={subtype}
                      className="w-8 h-8 mr-2"
                    />
                  )}
                  <span className="text-xs text-gray-500 dark:text-gray-400 mr-3">
                    {new Date(warning.updateTime).toLocaleTimeString('zh-HK', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className="text-sm text-gray-700 dark:text-gray-200 flex-1">
                    {isExpanded
                      ? warning.contents.map((c, i) => (
                          <span key={i} className="block mb-1">{c}</span>
                        ))
                      : warning.contents.length > 0 ? warning.contents[0] : ''}
                  </span>
                  <svg
                    className={`w-5 h-5 ml-2 text-yellow-500 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default WeatherDisplay;