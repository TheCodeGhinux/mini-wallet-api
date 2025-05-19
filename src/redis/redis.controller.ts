import { Controller, Get } from "@nestjs/common";
import { RedisService } from "./redis.service";

@Controller("redis")
export class RedisController {
  constructor(private readonly redisService: RedisService) {}

  @Get("health")
  async checkRedisHealth() {
    try {
      // Try a simple ping command
      const result = await this.redisService.getClient().ping();
      if (result === "PONG") {
        return {
          status: "ok",
          message: "Redis is connected and working fine.",
        };
      } else {
        return { status: "error", message: "Redis ping did not return PONG." };
      }
    } catch (error) {
      return {
        status: "error",
        message: "Unable to connect to Redis.",
        error: error.message,
      };
    }
  }
}
