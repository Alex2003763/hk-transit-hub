import { LocationCoordinates } from './geolocationService';

interface CachedLocationItem {
  coordinates: LocationCoordinates;
  displayName: string;
  source: string;
  timestamp: number;
  accuracy: number;
}

class LocationCache {
  private cache: CachedLocationItem[] = [];
  private readonly MAX_CACHE_SIZE = 50;
  private readonly CACHE_EXPIRY_MS = 15 * 60 * 1000; // 15 minutes

  public set(coordinates: LocationCoordinates, displayName: string, source: string): void {
    this.cleanupExpired();
    
    const newItem: CachedLocationItem = {
      coordinates,
      displayName,
      source,
      timestamp: Date.now(),
      accuracy: coordinates.accuracy || Infinity,
    };

    // Avoid duplicates
    this.cache = this.cache.filter(item => 
      !(item.coordinates.lat === newItem.coordinates.lat && item.coordinates.lng === newItem.coordinates.lng)
    );

    this.cache.unshift(newItem);

    if (this.cache.length > this.MAX_CACHE_SIZE) {
      this.cache.pop();
    }
  }

  public getBest(): CachedLocationItem | null {
    this.cleanupExpired();
    if (this.cache.length === 0) return null;

    // Return the most recent, most accurate entry
    const sortedCache = [...this.cache].sort((a, b) => {
        if (a.accuracy !== b.accuracy) {
            return a.accuracy - b.accuracy;
        }
        return b.timestamp - a.timestamp;
    });
    return sortedCache;
  }

  public hasNearby(coordinates: LocationCoordinates, radiusMeters: number): CachedLocationItem | null {
    this.cleanupExpired();
    const radiusDegrees = radiusMeters / 111320; // Rough conversion

    for (const item of this.cache) {
      const latDiff = item.coordinates.lat - coordinates.lat;
      const lngDiff = item.coordinates.lng - coordinates.lng;
      const distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);

      if (distance <= radiusDegrees) {
        return item;
      }
    }
    return null;
  }

  public clear(): void {
    this.cache = [];
  }

  public getStats(): { count: number; oldest?: number; newest?: number } {
    if (this.cache.length === 0) {
      return { count: 0 };
    }
    const timestamps = this.cache.map(item => item.timestamp);
    return {
      count: this.cache.length,
      oldest: Math.min(...timestamps),
      newest: Math.max(...timestamps),
    };
  }

  private cleanupExpired(): void {
    const now = Date.now();
    this.cache = this.cache.filter(item => (now - item.timestamp) < this.CACHE_EXPIRY_MS);
  }
}

export const locationCache = new LocationCache();