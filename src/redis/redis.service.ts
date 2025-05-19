import { Injectable } from "@nestjs/common";
import { Redis } from "ioredis";
// eslint-disable-next-line @typescript-eslint/naming-convention
import Redlock from "redlock";

@Injectable()
export class RedisService {
  constructor(
    private readonly redisClient: Redis,
    private readonly redlock: Redlock,
  ) {}

  /**
   * Get the Redis client
   * @returns Redis client
   */
  getClient(): Redis {
    return this.redisClient;
  }

  /**
   * Get the Redlock instance
   * @returns Redlock instance
   */
  // eslint-disable-next-line @typescript-eslint/naming-convention
  getRedlock(): Redlock {
    return this.redlock;
  }

  /**
   * Acquire a lock with Redlock
   * @param resource The resource to lock
   * @param ttl Lock time-to-live in milliseconds
   * @returns Lock object
   */
  async acquireLock(resource: string, ttl: number) {
    return await this.redlock.acquire([resource], ttl);
  }

  async acquireLockWithCbAndRetry<T>(
    resource: string,
    ttl: number,
    retryCount: number,
    cb: () => Promise<T>,
  ): Promise<T> {
    let lock;
    try {
      lock = await this.acquireLock(resource, ttl);
      const result = await cb();
      return result;
    } catch (error) {
      if (retryCount > 0) {
        return this.acquireLockWithCbAndRetry(
          resource,
          ttl,
          retryCount - 1,
          cb,
        );
      }
      throw error;
    } finally {
      await lock?.release();
    }
  }
}
