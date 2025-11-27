import memoizee from 'memoizee';
import type { Response } from 'express';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

// SSE Connection Manager for cache invalidation broadcasts
class SSEConnectionManager {
  private connections: Set<Response> = new Set();

  addConnection(res: Response): void {
    this.connections.add(res);
    console.log(`[SSE] Client connected (total: ${this.connections.size})`);
  }

  removeConnection(res: Response): void {
    this.connections.delete(res);
    console.log(`[SSE] Client disconnected (total: ${this.connections.size})`);
  }

  broadcast(data: { type: string; patterns?: string[] }): void {
    const message = `data: ${JSON.stringify(data)}\n\n`;
    for (const res of Array.from(this.connections)) {
      try {
        res.write(message);
      } catch (e) {
        // Connection might be closed
        this.connections.delete(res);
      }
    }
  }

  getConnectionCount(): number {
    return this.connections.size;
  }
}

export const sseConnectionManager = new SSEConnectionManager();

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

  // Invalidate cache patterns and broadcast to all SSE clients
  invalidatePattern(pattern: string, broadcast: boolean = false): void {
    const regex = new RegExp(pattern);
    const keys = Array.from(this.cache.keys());
    let invalidatedCount = 0;
    
    for (const key of keys) {
      if (regex.test(key)) {
        this.cache.delete(key);
        invalidatedCount++;
      }
    }
    
    // Broadcast to SSE clients if requested
    if (broadcast && invalidatedCount > 0) {
      const patternName = pattern.replace('^', '').replace(':', '');
      sseConnectionManager.broadcast({
        type: 'cache_invalidated',
        patterns: [patternName],
      });
    }
  }

  // Invalidate multiple patterns and broadcast once
  invalidatePatterns(patterns: string[]): void {
    const invalidatedPatterns: string[] = [];
    
    for (const pattern of patterns) {
      const regex = new RegExp(pattern);
      const keys = Array.from(this.cache.keys());
      let invalidatedCount = 0;
      
      for (const key of keys) {
        if (regex.test(key)) {
          this.cache.delete(key);
          invalidatedCount++;
        }
      }
      
      if (invalidatedCount > 0) {
        invalidatedPatterns.push(pattern.replace('^', '').replace(':', ''));
      }
    }
    
    // Broadcast once with all invalidated patterns
    if (invalidatedPatterns.length > 0) {
      sseConnectionManager.broadcast({
        type: 'cache_invalidated',
        patterns: invalidatedPatterns,
      });
      console.log(`[Cache] Invalidated and broadcast: ${invalidatedPatterns.join(', ')}`);
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
