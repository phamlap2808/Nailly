import Redis from 'ioredis'
import { loadEnv } from '../config/env'

export interface JsonCache {
  getJson<T>(key: string): Promise<T | null>
  setJson<T>(key: string, value: T, ttlSeconds: number): Promise<void>
  del(key: string): Promise<void>
}

export class RedisJsonCache implements JsonCache {
  constructor(private readonly redis = new Redis(loadEnv().REDIS_URL)) {}

  async getJson<T>(key: string): Promise<T | null> {
    const raw = await this.redis.get(key)
    return raw ? (JSON.parse(raw) as T) : null
  }

  async setJson<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    await this.redis.set(key, JSON.stringify(value), 'EX', ttlSeconds)
  }

  async del(key: string): Promise<void> {
    await this.redis.del(key)
  }
}
