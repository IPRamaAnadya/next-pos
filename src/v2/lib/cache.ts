import { redis } from './redis';

const KEY_PREFIX = 'mapunia';

/** Build a namespaced key: menopause:{parts joined by ':'} */
export function cacheKey(...parts: (string | number | undefined)[]): string {
  const segments = parts.filter(Boolean).map(String);
  return [KEY_PREFIX, ...segments].join(':');
}

/**
 * Get a cached value. Returns null on cache miss or Redis error.
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const raw = await redis.get(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch (err) {
    console.error('[Cache] GET error:', (err as Error).message);
    return null;
  }
}

/**
 * Store a value in the cache with a TTL (in seconds).
 */
export async function cacheSet(
  key: string,
  value: unknown,
  ttlSeconds: number
): Promise<void> {
  try {
    await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  } catch (err) {
    console.error('[Cache] SET error:', (err as Error).message);
  }
}

/**
 * Delete one or more exact keys.
 */
export async function cacheDel(...keys: string[]): Promise<void> {
  if (!keys.length) return;
  try {
    await redis.del(...keys);
  } catch (err) {
    console.error('[Cache] DEL error:', (err as Error).message);
  }
}

/**
 * Delete all keys matching a glob pattern using SCAN (non-blocking).
 * Example: cacheDelPattern('menopause:faq:*')
 */
export async function cacheDelPattern(pattern: string): Promise<void> {
  try {
    let cursor = '0';
    const keysToDelete: string[] = [];

    do {
      const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
      cursor = nextCursor;
      keysToDelete.push(...keys);
    } while (cursor !== '0');

    if (keysToDelete.length > 0) {
      await redis.del(...keysToDelete);
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Cache] Invalidated ${keysToDelete.length} key(s) matching "${pattern}"`);
      }
    }
  } catch (err) {
    console.error('[Cache] DEL pattern error:', (err as Error).message);
  }
}

/**
 * Cache-aside helper. Returns cached value if present, otherwise runs
 * `fetcher`, stores the result, and returns it. Never throws — on Redis
 * failure it falls through to the fetcher transparently.
 *
 * @param key      Full cache key (use cacheKey() to build it)
 * @param ttl      TTL in seconds
 * @param fetcher  Async function that produces the value to cache
 */
export async function withCache<T>(
  key: string,
  ttl: number,
  fetcher: () => Promise<T>
): Promise<T> {
  const cached = await cacheGet<T>(key);

  if (cached !== null) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Cache] HIT  ${key}`);
    }
    return cached;
  }

  if (process.env.NODE_ENV === 'development') {
    console.log(`[Cache] MISS ${key}`);
  }

  const value = await fetcher();
  await cacheSet(key, value, ttl);
  return value;
}

/** Common TTL constants (in seconds) */
export const TTL = {
  ONE_MINUTE: 60,
  THREE_MINUTES: 180,
  FIVE_MINUTES: 300,
  TEN_MINUTES: 600,
  FIFTEEN_MINUTES: 900,
  THIRTY_MINUTES: 1800,
  ONE_HOUR: 3600,
} as const;
