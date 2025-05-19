import {
  TransactionStatus,
  TransactionType,
} from "@modules/transactions/schemas/transaction.schema";
import { WalletsService } from "@modules/wallets/wallets.service";
import {
  HttpStatus,
  Injectable,
  InternalServerErrorException,
} from "@nestjs/common";
import { CustomHttpException } from "@shared/exception.handler";
import { PaystackService } from "./provider/paystack.service";
import { RedisService } from "src/redis/redis.service";
import { Connection } from "mongoose";
import { AuthUser } from "@middlewares/auth.guard";
import { InitiateTransferDto } from "./dots/transfer.dto";
import { TransactionsService } from "@modules/transactions/transactions.service";
import { InjectConnection } from "@nestjs/mongoose";

@Injectable()
export class TransferService {
  constructor(
    private readonly walletService: WalletsService,
    private readonly paystackService: PaystackService,
    private readonly redisService: RedisService,
    private readonly transactionService: TransactionsService,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  async initiateExternalTransfer(
    user: AuthUser,
    payload: InitiateTransferDto,
  ): Promise<any> {
    const wallet = await this.walletService.get({
      queryOptions: {
        user: user.sub,
        isDeleted: false,
      },
    });

    if (!wallet || wallet.balance < payload.amount) {
      throw new CustomHttpException(
        "Insufficient funds",
        HttpStatus.BAD_REQUEST,
      );
    }
    const reference = `ext-${Date.now()}-${user.sub}`;
    const lockKey = `locks:wallet:${wallet.id}`;
    const ttl = 10000;
    const retryCount = 3;

    return this.redisService.acquireLockWithCbAndRetry(
      lockKey,
      ttl,
      retryCount,
      async () => {
        const session = await this.connection.startSession();
        session.startTransaction();

        try {
          // First create a pending transaction
          const transaction = await this.transactionService.create({
            createPayload: {
              walletId: wallet.id,
              amount: payload.amount,
              type: TransactionType.DEBIT,
              reference,
              status: TransactionStatus.PENDING,
              metadata: {
                initiatedBy: user.sub,
                reason: payload.reason || "External transfer",
                bankCode: payload.bankCode,
                accountNumber: payload.accountNumber,
                initiatedAt: new Date(),
              },
            },
            dbTransaction: { useTransaction: true, session },
          });

          // Deduct from wallet balance
          wallet.balance -= payload.amount;
          await wallet.save({ session });

          // Initiate the transfer with Paystack
          const response = await this.paystackService.initiateTransfer({
            ...payload,
            reference,
          });

          if (response.status !== true) {
            console.error("Paystack transfer initiation failed", response);

            wallet.balance += payload.amount;
            await wallet.save({ session });

            // Update transaction to failed
            await this.transactionService.update({
              identifierOptions: { _id: transaction.id },
              updatePayload: {
                status: TransactionStatus.FAILED,
                metadata: {
                  ...transaction.metadata,
                  failureReason: response.message || "Transfer failed",
                  failedAt: new Date(),
                },
              },
              dbTransaction: { useTransaction: true, session },
            });

            await session.commitTransaction();

            throw new CustomHttpException(
              "Transfer failed: " + (response.message || "Unknown error"),
              HttpStatus.BAD_REQUEST,
            );
          }

          await this.transactionService.update({
            identifierOptions: { _id: transaction.id },
            updatePayload: {
              status: TransactionStatus.PENDING,
              metadata: {
                ...transaction.metadata,
                paystackTransferCode: response.data.transfer_code,
                paystackRecipientCode: response.data.recipient,
              },
            },
            dbTransaction: { useTransaction: true, session },
          });

          await session.commitTransaction();

          return {
            message: "External transfer initiated successfully",
            data: {
              reference,
              transferCode: response.data.transfer_code,
              amount: payload.amount,
              status: "pending",
            },
          };
        } catch (err) {
          await session.abortTransaction();
          console.error("Transfer initiation error", err);

          if (err instanceof CustomHttpException) {
            throw err;
          }

          throw new InternalServerErrorException(err.message);
        } finally {
          await session.endSession();
        }
      },
    );
  }

  async getTransferStatus(reference: string, user: AuthUser): Promise<any> {
    const transaction = await this.transactionService.get({
      queryOptions: {
        reference,
        "metadata.initiatedBy": user.sub,
      },
    });

    if (!transaction) {
      throw new CustomHttpException("Transfer not found", HttpStatus.NOT_FOUND);
    }

    return {
      reference: transaction.reference,
      amount: transaction.amount,
      status: transaction.status,
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt,
      metadata: transaction.metadata,
    };
  }
}
