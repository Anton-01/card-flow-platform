import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly client: Redis;
  private readonly logger = new Logger(RedisService.name);

  constructor(private configService: ConfigService) {
    this.client = new Redis({
      host: this.configService.get<string>('redis.host'),
      port: this.configService.get<number>('redis.port'),
      password: this.configService.get<string>('redis.password') || undefined,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    this.client.on('connect', () => {
      this.logger.log('Redis connection established');
    });

    this.client.on('error', (error) => {
      this.logger.error('Redis connection error:', error);
    });
  }

  async onModuleDestroy() {
    await this.client.quit();
    this.logger.log('Redis connection closed');
  }

  getClient(): Redis {
    return this.client;
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await this.client.setex(key, ttlSeconds, value);
    } else {
      await this.client.set(key, value);
    }
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async exists(key: string): Promise<boolean> {
    const result = await this.client.exists(key);
    return result === 1;
  }

  async setJson<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    await this.set(key, JSON.stringify(value), ttlSeconds);
  }

  async getJson<T>(key: string): Promise<T | null> {
    const value = await this.get(key);
    if (!value) return null;
    try {
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  }

  async increment(key: string): Promise<number> {
    return this.client.incr(key);
  }

  async expire(key: string, seconds: number): Promise<void> {
    await this.client.expire(key, seconds);
  }

  async keys(pattern: string): Promise<string[]> {
    return this.client.keys(pattern);
  }

  async deletePattern(pattern: string): Promise<void> {
    const keys = await this.keys(pattern);
    if (keys.length > 0) {
      await this.client.del(...keys);
    }
  }

  // Session management helpers
  async setSession(sessionId: string, userId: string, ttlSeconds: number): Promise<void> {
    await this.set(`session:${sessionId}`, userId, ttlSeconds);
    await this.client.sadd(`user_sessions:${userId}`, sessionId);
  }

  async getSession(sessionId: string): Promise<string | null> {
    return this.get(`session:${sessionId}`);
  }

  async deleteSession(sessionId: string, userId: string): Promise<void> {
    await this.del(`session:${sessionId}`);
    await this.client.srem(`user_sessions:${userId}`, sessionId);
  }

  async deleteAllUserSessions(userId: string): Promise<void> {
    const sessions = await this.client.smembers(`user_sessions:${userId}`);
    for (const sessionId of sessions) {
      await this.del(`session:${sessionId}`);
    }
    await this.del(`user_sessions:${userId}`);
  }

  // Rate limiting helpers
  async checkRateLimit(key: string, limit: number, windowSeconds: number): Promise<{
    allowed: boolean;
    remaining: number;
    resetIn: number;
  }> {
    const current = await this.increment(`ratelimit:${key}`);

    if (current === 1) {
      await this.expire(`ratelimit:${key}`, windowSeconds);
    }

    const ttl = await this.client.ttl(`ratelimit:${key}`);

    return {
      allowed: current <= limit,
      remaining: Math.max(0, limit - current),
      resetIn: ttl > 0 ? ttl : windowSeconds,
    };
  }
}
