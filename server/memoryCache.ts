import memoizee from 'memoizee';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class MemoryCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startCleanup();
  }

  private startCleanup() {
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      const entries = Array.from(this.cache.entries());
      for (const [key, entry] of entries) {
        if (now - entry.timestamp > entry.ttl) {
          this.cache.delete(key);
        }
      }
    }, 60000);
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data as T;
  }

  set<T>(key: string, data: T, ttlMs: number = 60000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs,
    });
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern);
    const keys = Array.from(this.cache.keys());
    for (const key of keys) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.cache.clear();
  }
}

export const memoryCache = new MemoryCache();

export const CACHE_TTL = {
  SHORT: 30 * 1000,
  MEDIUM: 2 * 60 * 1000,
  LONG: 5 * 60 * 1000,
  VERY_LONG: 15 * 60 * 1000,
} as const;

export function withCache<T>(
  cacheKey: string,
  ttl: number,
  fetcher: () => Promise<T>
): Promise<T> {
  const cached = memoryCache.get<T>(cacheKey);
  if (cached !== null) {
    return Promise.resolve(cached);
  }

  return fetcher().then((data) => {
    memoryCache.set(cacheKey, data, ttl);
    return data;
  });
}

export function createCachedFetcher<TArgs extends any[], TResult>(
  fetcher: (...args: TArgs) => Promise<TResult>,
  options: {
    maxAge?: number;
    normalizer?: (...args: TArgs) => string;
    primitive?: boolean;
  } = {}
) {
  const { maxAge = 60000, normalizer, primitive = true } = options;
  
  return memoizee(fetcher, {
    promise: true,
    maxAge,
    normalizer: normalizer ? (args: TArgs) => normalizer(...args) : undefined,
    primitive,
  });
}
