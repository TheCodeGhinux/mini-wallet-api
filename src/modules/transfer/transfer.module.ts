import { forwardRef, Module } from "@nestjs/common";
import { TransferService } from "./transfer.service";
import { TransferController } from "./transfer.controller";
import { PaystackService } from "./provider/paystack.service";
import { WalletsModule } from "@modules/wallets/wallets.module";
import { RedisModule } from "src/redis/redis.module";
import { TransactionsModule } from "@modules/transactions/transactions.module";
import { HttpModule, HttpService } from "@nestjs/axios";

@Module({
  imports: [
    forwardRef(() => WalletsModule),
    RedisModule,
    TransactionsModule,
    HttpModule,
  ],
  controllers: [TransferController],
  providers: [TransferService, PaystackService],
  exports: [TransferService, PaystackService],
})
export class TransferModule {}
