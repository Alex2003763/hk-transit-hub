interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface CacheConfig {
  maxAge: number; // in milliseconds
  maxSize: number; // maximum number of items
}

class CacheManager {
  private cache = new Map<string, CacheItem<any>>();
  private defaultConfig: CacheConfig = {
    maxAge: 5 * 60 * 1000, // 5 minutes
    maxSize: 100
  };

  set<T>(key: string, data: T, config?: Partial<CacheConfig>): void {
    const finalConfig = { ...this.defaultConfig, ...config };
    const now = Date.now();
    
    // Remove expired items and enforce size limit
    this.cleanup();
    
    if (this.cache.size >= finalConfig.maxSize) {
      // Remove oldest item
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt: now + finalConfig.maxAge
    });
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  has(key: string): boolean {
    const item = this.cache.get(key);
    if (!item) return false;
    
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  // Get cache statistics
  getStats() {
    const now = Date.now();
    let validItems = 0;
    let expiredItems = 0;

    for (const item of this.cache.values()) {
      if (now > item.expiresAt) {
        expiredItems++;
      } else {
        validItems++;
      }
    }

    return {
      totalItems: this.cache.size,
      validItems,
      expiredItems,
      memoryUsage: this.estimateMemoryUsage()
    };
  }

  private estimateMemoryUsage(): string {
    // Rough estimation of memory usage
    const jsonString = JSON.stringify(Array.from(this.cache.entries()));
    const bytes = new Blob([jsonString]).size;
    
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
}

// Create singleton instance
export const cacheManager = new CacheManager();

// Cache configurations for different data types
export const CACHE_CONFIGS = {
  ROUTES: { maxAge: 30 * 60 * 1000, maxSize: 50 }, // 30 minutes
  STOPS: { maxAge: 60 * 60 * 1000, maxSize: 200 }, // 1 hour
  ROUTE_STOPS: { maxAge: 15 * 60 * 1000, maxSize: 100 }, // 15 minutes
  ETA: { maxAge: 1 * 60 * 1000, maxSize: 500 }, // 1 minute
} as const;
