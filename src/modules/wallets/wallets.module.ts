import { Module } from "@nestjs/common";
import { WalletsService } from "./wallets.service";
import { WalletsController } from "./wallets.controller";
import { MongooseModule } from "@nestjs/mongoose";
import { WALLET } from "@database/schemas";
import { WalletSchema } from "./schemas/wallet.schema";
import { TransactionsModule } from "@modules/transactions/transactions.module";
import { RedisModule } from "src/redis/redis.module";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: WALLET, schema: WalletSchema }]),
    TransactionsModule,
    RedisModule,
  ],
  controllers: [WalletsController],
  providers: [WalletsService],
  exports: [WalletsService],
})
export class WalletsModule {}
