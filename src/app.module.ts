/* eslint-disable @typescript-eslint/unbound-method */
import { Logger, Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import config from "./config/configuration";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";
import * as mongoosePaginate from "mongoose-paginate-v2";
import { APP_GUARD } from "@nestjs/core";
import { AuthGuard } from "@middlewares/auth.guard";
import { TokenService } from "@helpers/jwt.token.service";
import { JwtModule } from "@nestjs/jwt";
import { UserModule } from "./modules/user/user.module";
import { WalletsModule } from "./modules/wallets/wallets.module";
import { TransactionsModule } from "./modules/transactions/transactions.module";
import { RedisModule } from "./redis/redis.module";
import AuthenticationModule from "./modules/authentication/authentication.module";
import WebhookModule from "@modules/webhook/webhook.module";
import { BullModule } from "@nestjs/bullmq";
import { BullBoardModule } from "@bull-board/nestjs";
import { ExpressAdapter } from "@bull-board/express";
import * as crypto from "crypto";
import * as expressBasicAuth from "express-basic-auth";
import { CacheModule } from "@nestjs/cache-manager";
import { RedisClientOptions } from "redis";
import { TransferModule } from "./modules/transfer/transfer.module";
import * as redisStore from "cache-manager-redis-store";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [config],
    }),
    JwtModule.register({
      global: true,
      secret: config().jwt.secret,
      signOptions: { expiresIn: config().jwt.expiresIn },
    }),
    MongooseModule.forRoot(config().database.url, {
      connectionFactory(connection) {
        connection.plugin(mongoosePaginate);
        return connection;
      },
    }),
    CacheModule.registerAsync<RedisClientOptions>({
      isGlobal: true,
      useFactory() {
        const { cache, isTest, redis } = config();
        if (isTest) {
          return { ttl: -1 };
        }

        if (!redis.host || !redis.port) {
          return { ttl: cache.ttl };
        }

        return {
          host: redis.host,
          port: redis.port,
          ttl: cache.ttl,
          password: redis.password,
          store: redisStore,
          isCacheableValue(value) {
            return value !== undefined;
          },
        };
      },
    }),
    BullModule.forRoot({
      connection: {
        host: config().redis.host,
        port: config().redis.port,
        password: config().redis.password,
      },
    }),
    BullBoardModule.forRoot({
      route: "/bull-board",
      middleware: expressBasicAuth({
        challenge: true,
        users: {
          admin:
            process.env.BULL_BOARD_ADMIN_PASSWORD ||
            crypto.randomBytes(32).toString("hex"),
        },
      }),
      adapter: ExpressAdapter,
    }),
    UserModule,
    AuthenticationModule,
    // CoursesModule,
    // QuizModule,
    WebhookModule,
    WalletsModule,
    TransactionsModule,
    RedisModule,
    TransferModule,
  ],

  controllers: [AppController],

  providers: [
    AppService,
    Logger,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: "CONFIG",
      useClass: ConfigService,
    },
    TokenService,
  ],
})
export class AppModule {}
