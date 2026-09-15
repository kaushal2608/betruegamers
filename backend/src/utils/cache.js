/**
 * High-Performance Multi-Tier Caching System for BeTrueGamers
 * Tier 1: Zero-latency in-memory cache (< 0.05ms) with 5-minute TTL
 * Tier 2: Distributed Redis Cloud cache (asynchronous background sync)
 * 
 * Non-blocking async writes: sets and invalidations update local memory in microseconds,
 * syncing to remote Redis in the background so API responses are never delayed by WAN latency.
 */

import { redisClient, isRedisReady } from '../config/redis.js';

class HybridCache {
  constructor(defaultTtlSeconds = 300, maxMemoryItems = 5000) {
    this.memoryCache = new Map();
    this.defaultTtlMs = defaultTtlSeconds * 1000;
    this.maxMemoryItems = maxMemoryItems;

    // Periodic cleanup of expired items in memory every 30 seconds
    setInterval(() => this.cleanupMemory(), 30000).unref();
  }

  // ---- Internal Memory Cache Helpers ----
  getFromMemory(key) {
    const item = this.memoryCache.get(key);
    if (!item) return null;

    if (Date.now() > item.expiry) {
      this.memoryCache.delete(key);
      return null;
    }

    return item.value;
  }

  setInMemory(key, value, ttlMs) {
    if (this.memoryCache.size >= this.maxMemoryItems) {
      const keysToDelete = Array.from(this.memoryCache.keys()).slice(0, Math.floor(this.maxMemoryItems * 0.1));
      for (const k of keysToDelete) {
        this.memoryCache.delete(k);
      }
    }

    this.memoryCache.set(key, {
      value,
      expiry: Date.now() + ttlMs
    });
  }

  cleanupMemory() {
    const now = Date.now();
    for (const [key, item] of this.memoryCache.entries()) {
      if (now > item.expiry) {
        this.memoryCache.delete(key);
      }
    }
  }

  // ---- Public Cache API ----

  /**
   * Fetch item from Tier 1 (Memory: <0.05ms) or Tier 2 (Redis WAN)
   */
  async get(key) {
    // 1. Check Tier 1 Memory Cache (Instant 0.05ms)
    const memVal = this.getFromMemory(key);
    if (memVal !== null && memVal !== undefined) {
      return memVal;
    }

    // 2. Check Tier 2 Redis Cloud Cache if memory missed
    if (isRedisReady()) {
      try {
        const raw = await redisClient.get(key);
        if (raw !== null && raw !== undefined) {
          const parsed = JSON.parse(raw);
          // Populate Tier 1 for 5 minutes so subsequent requests are <0.1ms
          this.setInMemory(key, parsed, this.defaultTtlMs);
          return parsed;
        }
      } catch (err) {
        console.warn(`[Cache Warning] Redis get failed for key "${key}":`, err.message);
      }
    }

    return null;
  }

  /**
   * Set item in Tier 1 (Memory) immediately and sync to Tier 2 (Redis) in background
   */
  async set(key, value, ttlSeconds) {
    const effectiveTtl = ttlSeconds !== undefined ? ttlSeconds : Math.floor(this.defaultTtlMs / 1000);
    const ttlMs = effectiveTtl * 1000;

    // 1. Set in Tier 1 Memory immediately (instant!)
    this.setInMemory(key, value, ttlMs);

    // 2. Sync to Tier 2 Redis in background (non-blocking for instant API returns)
    if (isRedisReady()) {
      try {
        const serialized = JSON.stringify(value);
        if (effectiveTtl > 0) {
          redisClient.set(key, serialized, 'EX', effectiveTtl).catch(() => {});
        } else {
          redisClient.set(key, serialized).catch(() => {});
        }
      } catch (err) {}
    }
  }

  /**
   * Delete item from both tiers
   */
  async del(key) {
    this.memoryCache.delete(key);

    if (isRedisReady()) {
      redisClient.del(key).catch(() => {});
    }
  }

  /**
   * Invalidate all keys matching prefix from both tiers
   */
  async delPrefix(prefix) {
    // 1. Invalidate Memory Cache immediately
    for (const key of this.memoryCache.keys()) {
      if (key.startsWith(prefix)) {
        this.memoryCache.delete(key);
      }
    }

    // 2. Invalidate Redis Cache in background
    if (isRedisReady()) {
      (async () => {
        try {
          let cursor = '0';
          do {
            const [nextCursor, keys] = await redisClient.scan(
              cursor,
              'MATCH',
              `${prefix}*`,
              'COUNT',
              100
            );
            cursor = nextCursor;
            if (keys && keys.length > 0) {
              await redisClient.del(...keys);
            }
          } while (cursor !== '0');
        } catch (err) {}
      })().catch(() => {});
    }
  }

  /**
   * Clear all caches
   */
  async clear() {
    this.memoryCache.clear();
    if (isRedisReady()) {
      try {
        await redisClient.flushdb();
      } catch (err) {}
    }
  }

  /**
   * Cache-Aside Helper: Gets value if cached, otherwise computes, caches, and returns it.
   */
  async getOrSet(key, fetchFn, ttlSeconds) {
    const cached = await this.get(key);
    if (cached !== null && cached !== undefined) {
      return cached;
    }

    const fresh = await fetchFn();
    if (fresh !== null && fresh !== undefined) {
      await this.set(key, fresh, ttlSeconds);
    }
    return fresh;
  }
}

export const appCache = new HybridCache(300);
