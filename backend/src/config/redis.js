import Redis from 'ioredis';
import { ENV } from './env.js';

let redisClient = null;
let isConnected = false;

if (ENV.REDIS_URL) {
  try {
    redisClient = new Redis(ENV.REDIS_URL, {
      maxRetriesPerRequest: 3,
      connectTimeout: 10000,
      enableReadyCheck: true,
      retryStrategy(times) {
        const delay = Math.min(times * 200, 3000);
        return delay;
      }
    });

    redisClient.on('connect', () => {
      console.log('⚡ [Redis] Connecting to Redis Cloud...');
    });

    redisClient.on('ready', () => {
      isConnected = true;
      console.log('🚀 [Redis] Connected & ready to serve caching requests!');
    });

    redisClient.on('error', (err) => {
      isConnected = false;
      console.warn(`⚠️ [Redis Warning] Connection error: ${err.message}`);
    });

    redisClient.on('close', () => {
      isConnected = false;
    });

    redisClient.on('reconnecting', () => {
      console.log('🔄 [Redis] Reconnecting to Redis...');
    });
  } catch (error) {
    console.warn(`⚠️ [Redis] Failed to initialize Redis client: ${error.message}`);
    redisClient = null;
  }
} else {
  console.log('ℹ️ [Redis] No REDIS_URL provided. Operating with in-memory cache.');
}

export const getRedisClient = () => redisClient;
export const isRedisReady = () => isConnected && redisClient?.status === 'ready';

export { redisClient };
