import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Singleton pattern — reuse the connection across hot-reloads in dev
declare global {
  // eslint-disable-next-line no-var
  var _redisClient: Redis | undefined;
}

function createRedisClient(): Redis {
  const client = new Redis(REDIS_URL, {
    maxRetriesPerRequest: 3,
    lazyConnect: true,
    enableOfflineQueue: false,
  });

  client.on('error', (err) => {
    console.error('[Redis] Connection error:', err.message);
  });

  client.on('connect', () => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[Redis] Connected');
    }
  });

  return client;
}

export const redis: Redis =
  globalThis._redisClient ?? (globalThis._redisClient = createRedisClient());
