import { Module } from "@nestjs/common";
import { RedisService } from "./redis.service";
import { RedisController } from "./redis.controller";
import Redlock from "redlock";
import { Redis } from "ioredis";
import { ConfigModule } from "@nestjs/config";
import config from "src/config/configuration";

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: Redis,
      useFactory: () => {
        const redisConfig = config().redis;
        const redis = new Redis({
          host: redisConfig.host,
          port: redisConfig.port,
          password: redisConfig.password || undefined,
          db: redisConfig.db,
          tls: redisConfig.tls ? {} : undefined,
        });
        return redis;
      },
    },
    {
      provide: Redlock,
      useFactory: async (redisClient: Redis) => {
        const redlock = new Redlock([redisClient], {
          driftFactor: 0.01,
          retryCount: 10,
          retryDelay: 200,
          retryJitter: 200,
          automaticExtensionThreshold: 500,
        });

        try {
          const lock = await redlock.acquire(["startup-check"], 1000);
          await lock.release();
          console.log("[Redlock] Lock acquisition test passed");
        } catch (err) {
          console.error("[Redlock] Failed to acquire test lock:", err.message);
          throw err;
        }

        return redlock;
      },
      inject: [Redis],
    },

    RedisService,
  ],
  controllers: [RedisController],
  exports: [Redis, Redlock, RedisService],
})
export class RedisModule {}
