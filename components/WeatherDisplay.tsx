import React, { useState, useEffect } from 'react';
import Loader from './Loader';
import ErrorDisplay from './ErrorDisplay';
import { geolocationService, LocationCoordinates } from '../services/geolocationService';
import { getWeatherIcon } from '../utils/weatherIcons.js';

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

  useEffect(() => {
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
    <div className="bg-gradient-to-br from-blue-100 to-blue-200 dark:from-gray-800 dark:to-gray-900 p-4 rounded-xl shadow-lg mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xl font-bold text-gray-800 dark:text-white">
          {selectedStation === 'closest'
            ? (closestStation ? `您附近 (${closestStation.place}) 的天氣` : '香港天氣')
            : `${selectedStation} 的天氣`}
        </h3>
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
        {weather.icon.length > 0 && (
          <img
            src={getWeatherIcon(weather.icon)}
            alt="Weather Icon"
            className="w-12 h-12"
          />
        )}
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

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-center">
        {displayTemperature && (
          <div className="bg-white/60 dark:bg-gray-700/50 p-3 rounded-lg backdrop-blur-sm">
            <p className="text-sm text-gray-600 dark:text-gray-400">溫度</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {displayTemperature.value}°<span className="text-lg">{displayTemperature.unit}</span>
            </p>
          </div>
        )}
      </div>

      {weather.warnings.length > 0 && (
        <div className="mt-4">
          <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">天氣警告</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {weather.warnings.map((warning, index) => {
              // 根據警告類型確定顏色
              let bgColor = 'bg-red-100';
              let borderColor = 'border-red-500';
              let textColor = 'text-red-800';
              let darkBgColor = 'dark:bg-red-900/50';
              let darkTextColor = 'dark:text-red-200';
              
              if (warning.warningStatementCode.includes('雷暴')) {
                bgColor = 'bg-yellow-100';
                borderColor = 'border-yellow-500';
                textColor = 'text-yellow-800';
                darkBgColor = 'dark:bg-yellow-900/50';
                darkTextColor = 'dark:text-yellow-200';
              } else if (warning.warningStatementCode.includes('火災')) {
                bgColor = 'bg-orange-100';
                borderColor = 'border-orange-500';
                textColor = 'text-orange-800';
                darkBgColor = 'dark:bg-orange-900/50';
                darkTextColor = 'dark:text-orange-200';
              }
              
              return (
                <div
                  key={index}
                  className={`${bgColor} ${darkBgColor} border-l-4 ${borderColor} rounded-lg shadow-sm overflow-hidden`}
                >
                  <div className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className={`h-5 w-5 ${textColor} ${darkTextColor} mr-2`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                          />
                        </svg>
                        <p className={`font-bold ${textColor} ${darkTextColor}`}>{warning.warningStatementCode}</p>
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        更新: {new Date(warning.updateTime).toLocaleTimeString('tc-HK', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <ul className="list-disc list-inside text-sm mt-2 ml-2">
                      {warning.contents.map((content, i) => (
                        <li key={i} className={`${textColor} ${darkTextColor}`}>{content}</li>
                      ))}
                    </ul>
                  </div>
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