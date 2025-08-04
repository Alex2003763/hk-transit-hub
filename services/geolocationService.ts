/**
 * Enhanced Geolocation Service for HK Transit Hub
 * Provides accurate, reliable location detection with progressive fallback strategies
 */

export interface LocationCoordinates {
  lat: number;
  lng: number;
  accuracy?: number;
  timestamp?: number;
}

export interface LocationResult {
  coordinates: LocationCoordinates;
  displayName: string;
  source: 'gps' | 'network' | 'cache' | 'fallback';
  accuracy: 'high' | 'medium' | 'low';
}

export interface GeolocationError {
  code: number;
  message: string;
  type: 'permission_denied' | 'position_unavailable' | 'timeout' | 'not_supported' | 'network_error';
}

export interface GeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  fallbackToLowAccuracy?: boolean;
  useCache?: boolean;
  requireUserInteraction?: boolean;
  enableReverseGeocoding?: boolean;
}

interface CachedLocation {
  coordinates: LocationCoordinates;
  displayName: string;
  timestamp: number;
  accuracy: number;
  source: string;
}

class GeolocationService {
  private static instance: GeolocationService;
  private cachedLocation: CachedLocation | null = null;
  private isLocating = false;
  private lastLocationTime = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private readonly MIN_ACCURACY_THRESHOLD = 100; // meters
  private readonly HONG_KONG_BOUNDS = {
    north: 22.5,
    south: 22.1,
    east: 114.5,
    west: 113.8
  };

  private constructor() {}

  public static getInstance(): GeolocationService {
    if (!GeolocationService.instance) {
      GeolocationService.instance = new GeolocationService();
    }
    return GeolocationService.instance;
  }

  /**
   * Check if geolocation is supported by the browser
   */
  public isSupported(): boolean {
    return 'geolocation' in navigator && 'getCurrentPosition' in navigator.geolocation;
  }

  /**
   * Check geolocation permission status
   */
  public async checkPermission(): Promise<'granted' | 'denied' | 'prompt' | 'unsupported'> {
    if (!this.isSupported()) {
      return 'unsupported';
    }

    if ('permissions' in navigator) {
      try {
        const permission = await navigator.permissions.query({ name: 'geolocation' });

        // On some browsers (especially mobile Safari), the Permissions API
        // may return 'granted' but actual geolocation calls still fail
        // We'll still return the API result but handle this in the calling code
        return permission.state;
      } catch (error) {
        console.warn('Permission API not supported:', error);
      }
    }

    // Fallback: try to determine from previous attempts
    return 'prompt';
  }

  /**
   * Request geolocation permission with user guidance
   */
  public async requestPermission(): Promise<{
    granted: boolean;
    error?: GeolocationError;
    guidance?: string;
  }> {
    const permissionStatus = await this.checkPermission();

    if (permissionStatus === 'unsupported') {
      return {
        granted: false,
        error: this.createError(0, 'Geolocation is not supported', 'not_supported'),
        guidance: 'Your browser does not support location services. Please use a modern browser.'
      };
    }

    if (permissionStatus === 'denied') {
      return {
        granted: false,
        error: this.createError(1, 'Location permission denied', 'permission_denied'),
        guidance: 'Location access is blocked. Please enable it in your browser settings and refresh the page.'
      };
    }

    if (permissionStatus === 'granted') {
      return { granted: true };
    }

    // Permission is 'prompt' - try to get location to trigger permission request
    try {
      await this.getCurrentPositionPromise({
        enableHighAccuracy: false,
        timeout: 8000,
        maximumAge: 0
      });
      return { granted: true };
    } catch (error) {
      const geoError = error as GeolocationError;

      let guidance = '';
      switch (geoError.code) {
        case 1:
          guidance = 'Please allow location access when prompted, or enable it in your browser settings.';
          break;
        case 2:
          guidance = 'Location information is unavailable. Please check your device settings and try again.';
          break;
        case 3:
          guidance = 'Location request timed out. Please try again or check your connection.';
          break;
        default:
          guidance = 'An error occurred while requesting location access. Please try again.';
      }

      return {
        granted: false,
        error: geoError,
        guidance
      };
    }
  }

  /**
   * Quick permission check without triggering permission prompt
   */
  public async isPermissionGranted(): Promise<boolean> {
    const status = await this.checkPermission();
    return status === 'granted';
  }

  /**
   * Check if we're likely in Hong Kong based on coordinates
   */
  private isInHongKong(lat: number, lng: number): boolean {
    return lat >= this.HONG_KONG_BOUNDS.south && 
           lat <= this.HONG_KONG_BOUNDS.north &&
           lng >= this.HONG_KONG_BOUNDS.west && 
           lng <= this.HONG_KONG_BOUNDS.east;
  }

  /**
   * Get cached location if available and valid
   */
  private getCachedLocation(): CachedLocation | null {
    // First check advanced cache
    const cached = locationCache.getBest();
    if (cached) {
      return {
        coordinates: cached.coordinates,
        displayName: cached.displayName,
        timestamp: cached.timestamp,
        accuracy: cached.accuracy,
        source: cached.source
      };
    }

    // Fallback to simple cache
    if (!this.cachedLocation) return null;

    const now = Date.now();
    const age = now - this.cachedLocation.timestamp;

    if (age > this.CACHE_DURATION) {
      this.cachedLocation = null;
      return null;
    }

    return this.cachedLocation;
  }

  /**
   * Cache a location result
   */
  private cacheLocation(coordinates: LocationCoordinates, displayName: string, source: string): void {
    // Cache in advanced cache
    locationCache.set(coordinates, displayName, source);

    // Also cache in simple cache for backward compatibility
    this.cachedLocation = {
      coordinates,
      displayName,
      timestamp: Date.now(),
      accuracy: coordinates.accuracy || 0,
      source
    };
  }

  /**
   * Generate a display name for coordinates with optional reverse geocoding
   */
  private async generateDisplayName(
    coordinates: LocationCoordinates,
    enableReverseGeocoding: boolean = false,
    geocodingOptions?: ReverseGeocodingOptions
  ): Promise<string> {
    if (enableReverseGeocoding) {
      try {
        const result = await reverseGeocodingService.reverseGeocode(coordinates, geocodingOptions);
        return result.displayName;
      } catch (error) {
        console.warn('Reverse geocoding failed, using fallback:', error);
      }
    }

    const { lat, lng, accuracy } = coordinates;
    const accuracyText = accuracy ? ` (±${Math.round(accuracy)}m)` : '';
    return `Current Location (${lat.toFixed(4)}, ${lng.toFixed(4)})${accuracyText}`;
  }

  /**
   * Validate coordinates for reasonableness
   */
  private validateCoordinates(lat: number, lng: number): boolean {
    // Basic validation
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return false;
    }
    
    // Check if coordinates are not null island (0,0)
    if (lat === 0 && lng === 0) {
      return false;
    }
    
    return true;
  }

  /**
   * Get current location with progressive accuracy strategy
   */
  public async getCurrentLocation(options: GeolocationOptions = {}): Promise<LocationResult> {
    if (!this.isSupported()) {
      throw this.createError(0, 'Geolocation is not supported by this browser', 'not_supported');
    }

    // Check cache first if enabled
    if (options.useCache !== false) {
      const cached = this.getCachedLocation();
      if (cached) {
        return {
          coordinates: cached.coordinates,
          displayName: cached.displayName,
          source: 'cache',
          accuracy: this.getAccuracyLevel(cached.accuracy)
        };
      }
    }

    // Prevent multiple simultaneous requests
    if (this.isLocating) {
      throw this.createError(3, 'Location request already in progress', 'timeout');
    }

    this.isLocating = true;

    try {
      const result = await this.attemptLocationWithFallback(options);
      this.isLocating = false;
      return result;
    } catch (error) {
      this.isLocating = false;

      // If we get a permission denied error, provide detailed troubleshooting info
      const geoError = error as GeolocationError;
      if (geoError.code === 1) {
        console.warn('🚫 Location permission denied. This could be due to:');
        console.warn('1. Browser cached a previous "deny" decision');
        console.warn('2. Site permissions need to be reset');
        console.warn('3. Browser security settings blocking location');
        console.warn('');
        console.warn('🔧 To fix this:');
        console.warn('1. Click the lock/info icon in the address bar');
        console.warn('2. Reset permissions for this site');
        console.warn('3. Refresh the page and try again');
        console.warn('');
        console.warn('💡 Or run: resetLocationPermission() in console');

        // Enhance the error with troubleshooting info
        const enhancedError = this.createError(
          1,
          'Location access denied. Please reset site permissions and try again.',
          'permission_denied'
        );
        throw enhancedError;
      }

      throw error;
    }
  }

  /**
   * Attempt location detection with progressive fallback
   */
  private async attemptLocationWithFallback(options: GeolocationOptions): Promise<LocationResult> {
    // Get network-aware recommendations
    const networkOptions = networkService.getGeolocationOptions();
    const isFastConnection = networkService.isFastConnection();

    // Detect mobile Safari which has known permission issues
    const isMobileSafari = navigator.userAgent.includes('Safari') &&
                          navigator.userAgent.includes('Mobile') &&
                          !navigator.userAgent.includes('Chrome');

    const strategies = [
      // Strategy 1: Conservative start for mobile Safari, high accuracy for others
      ...(isFastConnection && !networkService.isDataSavingEnabled() && !isMobileSafari ? [{
        enableHighAccuracy: true,
        timeout: Math.min(8000, networkOptions.timeout * 0.6),
        maximumAge: 60000,
        description: 'high-accuracy-fast'
      }] : []),

      // Strategy 2: Mobile Safari friendly approach
      ...(isMobileSafari ? [{
        enableHighAccuracy: false,
        timeout: 15000,
        maximumAge: 120000,
        description: 'mobile-safari-friendly'
      }] : []),

      // Strategy 3: Network-optimized accuracy
      {
        enableHighAccuracy: networkOptions.enableHighAccuracy && !isMobileSafari,
        timeout: networkOptions.timeout,
        maximumAge: networkOptions.maximumAge,
        description: 'network-optimized'
      },

      // Strategy 4: Conservative fallback
      {
        enableHighAccuracy: false,
        timeout: Math.max(15000, networkOptions.timeout * 1.5),
        maximumAge: 300000,
        description: 'conservative-fallback'
      },

      // Strategy 5: Last resort (offline-friendly)
      {
        enableHighAccuracy: false,
        timeout: 30000,
        maximumAge: 600000, // 10 minutes
        description: 'last-resort'
      }
    ];

    let lastError: GeolocationError | null = null;

    for (let i = 0; i < strategies.length; i++) {
      const strategy = strategies[i];
      try {
        console.log(`Attempting geolocation with ${strategy.description} strategy (${i + 1}/${strategies.length})`);
        const position = await this.getCurrentPositionPromise(strategy);

        const { latitude, longitude, accuracy } = position.coords;

        // Validate coordinates
        if (!this.validateCoordinates(latitude, longitude)) {
          console.warn(`Invalid coordinates received: ${latitude}, ${longitude}`);
          continue;
        }

        // Check if we're in Hong Kong (optional warning)
        if (!this.isInHongKong(latitude, longitude)) {
          console.warn(`Location appears to be outside Hong Kong: ${latitude}, ${longitude}`);
        }

        const coordinates: LocationCoordinates = {
          lat: latitude,
          lng: longitude,
          accuracy: accuracy || undefined,
          timestamp: Date.now()
        };

        const displayName = await this.generateDisplayName(
          coordinates,
          options.enableReverseGeocoding,
          options.geocodingOptions
        );
        const source = strategy.enableHighAccuracy ? 'gps' : 'network';
        const accuracyLevel = this.getAccuracyLevel(accuracy || 0);

        // Cache the result
        this.cacheLocation(coordinates, displayName, source);

        console.log(`Location successfully obtained using ${strategy.description} strategy:`, {
          coordinates,
          accuracy: accuracyLevel,
          source
        });

        return {
          coordinates,
          displayName,
          source,
          accuracy: accuracyLevel
        };

      } catch (error) {
        const geoError = error as GeolocationError;
        console.warn(`${strategy.description} strategy failed:`, geoError);
        lastError = geoError;

        // If permission denied, don't try other strategies
        if (geoError.code === 1) {
          console.error('Permission denied - stopping all location attempts');
          break;
        }

        // If this is not the last strategy, continue to next one
        if (i < strategies.length - 1) {
          console.log(`Trying next strategy...`);
        }
      }
    }

    // All strategies failed
    throw lastError || this.createError(2, 'All location strategies failed', 'position_unavailable');
  }

  /**
   * Convert native geolocation to Promise
   */
  private getCurrentPositionPromise(options: PositionOptions): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        resolve,
        (error) => reject(this.createError(error.code, error.message, this.getErrorType(error.code))),
        options
      );
    });
  }

  /**
   * Determine accuracy level based on accuracy value
   */
  private getAccuracyLevel(accuracy: number): 'high' | 'medium' | 'low' {
    if (accuracy <= 10) return 'high';
    if (accuracy <= 50) return 'medium';
    return 'low';
  }

  /**
   * Create standardized error object
   */
  private createError(code: number, message: string, type: GeolocationError['type']): GeolocationError {
    return { code, message, type };
  }

  /**
   * Map error codes to types
   */
  private getErrorType(code: number): GeolocationError['type'] {
    switch (code) {
      case 1: return 'permission_denied';
      case 2: return 'position_unavailable';
      case 3: return 'timeout';
      default: return 'position_unavailable';
    }
  }

  /**
   * Clear cached location
   */
  public clearCache(): void {
    this.cachedLocation = null;
    locationCache.clear();
  }

  /**
   * Get cache status
   */
  public getCacheStatus(): { hasCache: boolean; age?: number; accuracy?: number; stats?: any } {
    const cached = this.getCachedLocation();
    const cacheStats = locationCache.getStats();

    if (!cached) {
      return { hasCache: false, stats: cacheStats };
    }

    return {
      hasCache: true,
      age: Date.now() - cached.timestamp,
      accuracy: cached.accuracy,
      stats: cacheStats
    };
  }

  /**
   * Get nearby cached location
   */
  public getNearbyLocation(coordinates: LocationCoordinates, radiusMeters: number = 50): LocationResult | null {
    const nearby = locationCache.hasNearby(coordinates, radiusMeters);
    if (!nearby) return null;

    return {
      coordinates: nearby.coordinates,
      displayName: nearby.displayName,
      source: 'cache',
      accuracy: this.getAccuracyLevel(nearby.accuracy)
    };
  }
}

// Export singleton instance
export const geolocationService = GeolocationService.getInstance();
