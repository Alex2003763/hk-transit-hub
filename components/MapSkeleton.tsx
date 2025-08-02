import React from 'react';

interface MapSkeletonProps {
  className?: string;
}

const MapSkeleton: React.FC<MapSkeletonProps> = ({ className = '' }) => {
  return (
    <div className={`relative bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden ${className}`}>
      {/* Map background skeleton */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800">
        {/* Animated grid pattern to simulate map tiles */}
        <div className="absolute inset-0 opacity-30">
          <div className="grid grid-cols-4 grid-rows-4 h-full w-full">
            {Array.from({ length: 16 }).map((_, i) => (
              <div
                key={i}
                className="border border-gray-300 dark:border-gray-600 animate-pulse"
                style={{
                  animationDelay: `${i * 0.1}s`,
                  animationDuration: '2s'
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Skeleton markers */}
      <div className="absolute inset-0">
        {/* Terminal markers */}
        <div className="absolute top-1/4 left-1/4 w-6 h-6 bg-teal-400 rounded-full animate-pulse shadow-lg" />
        <div className="absolute bottom-1/4 right-1/4 w-6 h-6 bg-teal-400 rounded-full animate-pulse shadow-lg" style={{ animationDelay: '0.5s' }} />
        
        {/* Regular stop markers */}
        <div className="absolute top-1/3 left-1/2 w-4 h-4 bg-gray-400 rounded-full animate-pulse shadow-md" style={{ animationDelay: '0.2s' }} />
        <div className="absolute top-1/2 left-1/3 w-4 h-4 bg-gray-400 rounded-full animate-pulse shadow-md" style={{ animationDelay: '0.7s' }} />
        <div className="absolute bottom-1/3 right-1/3 w-4 h-4 bg-gray-400 rounded-full animate-pulse shadow-md" style={{ animationDelay: '0.4s' }} />
        <div className="absolute top-2/3 right-1/2 w-4 h-4 bg-gray-400 rounded-full animate-pulse shadow-md" style={{ animationDelay: '0.9s' }} />
      </div>

      {/* Skeleton route line */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-3/4 h-1 bg-teal-300 rounded-full animate-pulse opacity-60" style={{ animationDelay: '0.3s' }} />
      </div>

      {/* Loading overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
          <div className="text-sm font-medium">Loading map...</div>
        </div>
      </div>

      {/* Map controls skeleton */}
      <div className="absolute top-4 right-4 space-y-2">
        <div className="w-8 h-8 bg-white dark:bg-gray-700 rounded shadow-md animate-pulse" />
        <div className="w-8 h-8 bg-white dark:bg-gray-700 rounded shadow-md animate-pulse" style={{ animationDelay: '0.2s' }} />
      </div>

      {/* Attribution skeleton */}
      <div className="absolute bottom-2 right-2">
        <div className="w-20 h-4 bg-white dark:bg-gray-700 rounded animate-pulse opacity-70" />
      </div>
    </div>
  );
};

export default MapSkeleton;
