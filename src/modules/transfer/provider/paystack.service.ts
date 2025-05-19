import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import configuration from "@config/configuration";
import { TransactionsService } from "@modules/transactions/transactions.service";
import { TransactionStatus } from "@modules/transactions/schemas/transaction.schema";
import { InjectConnection } from "@nestjs/mongoose";
import { Connection } from "mongoose";
import { RedisService } from "src/redis/redis.service";
import { WalletsService } from "@modules/wallets/wallets.service";
import * as crypto from "crypto";

@Injectable()
export class PaystackService {
  constructor(
    private readonly httpService: HttpService,
    private readonly transactionService: TransactionsService,
    @InjectConnection() private readonly connection: Connection,
    private readonly redisService: RedisService,
    private readonly walletService: WalletsService,
  ) {}

  async initiateTransfer(data: {
    bankCode: string;
    accountNumber: string;
    amount: number;
    reason: string;
    reference: string;
  }): Promise<any> {
    try {
      const recipientCode = await this.createTransferRecipient(data);

      const payload = {
        source: "balance",
        amount: data.amount,
        reason: data.reason,
        reference: data.reference,
        recipient: recipientCode,
      };

      const res = await this.httpService.axiosRef.post(
        "https://api.paystack.co/transfer",
        payload,
        {
          headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          },
        },
      );

      return res.data;
    } catch (err) {
      console.error(
        "initiateTransfer error:",
        err.response?.data || err.message,
      );
      throw new InternalServerErrorException("Failed to initiate transfer");
    }
  }

  private async createTransferRecipient(data: {
    bankCode: string;
    accountNumber: string;
  }): Promise<string> {
    try {
      const res = await this.httpService.axiosRef.post(
        "https://api.paystack.co/transferrecipient",
        {
          type: "nuban",
          name: "Paystack User",
          account_number: data.accountNumber,
          bank_code: data.bankCode,
          currency: "NGN",
        },
        {
          headers: {
            Authorization: `Bearer ${configuration().paystack.secretKey}`,
          },
        },
      );

      return res.data.data.recipient_code;
    } catch (err) {
      console.error(
        "createTransferRecipient error:",
        err.response?.data || err.message,
      );
      throw new InternalServerErrorException(
        "Failed to create transfer recipient",
      );
    }
  }

  async getBankList(): Promise<any> {
    try {
      const response = await this.httpService.axiosRef.get(
        "https://api.paystack.co/bank",
        {
          headers: {
            Authorization: `Bearer ${configuration().paystack.secretKey}`,
          },
        },
      );

      return response.data;
    } catch (err) {
      console.error("getBankList error:", err.response?.data || err.message);
      throw new InternalServerErrorException("Failed to fetch bank list");
    }
  }

  /**
   * Verify that the webhook request actually came from Paystack
   */
  verifyWebhookSignature(signature: string, payload: string): boolean {
    const secret = configuration().paystack.webhookSecret;
    const hash = crypto
      .createHmac("sha512", secret)
      .update(payload)
      .digest("hex");

    return hash === signature;
  }

  /**
   * Process webhook events from Paystack
   */
  async handleWebhookEvent(event: string, data: any): Promise<void> {
    console.log(`Processing ${event} webhook event`);

    switch (event) {
      case "transfer.success":
        await this.handleTransferSuccess(data);
        break;
      case "transfer.failed":
        await this.handleTransferFailed(data);
        break;
      case "transfer.reversed":
        await this.handleTransferReversed(data);
        break;
      default:
        console.log(`Unhandled event: ${event}`);
    }
  }

  /**
   * Handle successful transfers
   */
  private async handleTransferSuccess(data: any): Promise<void> {
    const reference = data.reference;

    const transaction = await this.transactionService.get({
      queryOptions: { reference },
    });

    if (!transaction) {
      console.warn(`Transaction with reference ${reference} not found`);
      return;
    }

    // Update the transaction status if needed
    if (transaction.status !== TransactionStatus.SUCCESS) {
      await this.transactionService.update({
        identifierOptions: { _id: transaction.id },
        updatePayload: {
          status: TransactionStatus.SUCCESS,
          metadata: {
            ...transaction.metadata,
            paystackTransferCode: data.transfer_code,
            paystackRecipientCode: data.recipient.recipient_code,
            transferCompletedAt: new Date(),
          },
        },
        dbTransaction: { useTransaction: false },
      });

      console.log(`Transaction ${reference} marked as successful`);
    }
  }

  /**
   * Handle failed transfers
   */
  private async handleTransferFailed(data: any): Promise<void> {
    const reference = data.reference;

    // Find the transaction by reference
    const transaction = await this.transactionService.get({
      queryOptions: { reference },
    });

    if (!transaction) {
      console.warn(`Transaction with reference ${reference} not found`);
      return;
    }

    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      // Only refund if the transaction was previously marked as successful or pending
      if (
        transaction.status === TransactionStatus.SUCCESS ||
        transaction.status === TransactionStatus.PENDING
      ) {
        // Get the wallet
        const wallet = await this.walletService.get({
          queryOptions: { _id: transaction.walletId },
        });

        if (!wallet) {
          console.error(`Wallet not found for transaction ${reference}`);
          await session.abortTransaction();
          return;
        }

        // Lock the wallet during the refund process
        const lockKey = `locks:wallet:${wallet.id}`;
        const ttl = 10000;
        const retryCount = 3;

        await this.redisService.acquireLockWithCbAndRetry(
          lockKey,
          ttl,
          retryCount,
          async () => {
            // Refund the amount to the wallet
            wallet.balance += transaction.amount;
            await wallet.save({ session });

            // Update the transaction status
            await this.transactionService.update({
              identifierOptions: { _id: transaction.id },
              updatePayload: {
                status: TransactionStatus.FAILED,
                metadata: {
                  ...transaction.metadata,
                  paystackTransferCode: data.transfer_code,
                  failureReason: data.reason,
                  refundedAt: new Date(),
                },
              },
              dbTransaction: { useTransaction: true, session },
            });

            console.log(`Refunded amount for failed transfer ${reference}`);
          },
        );
      } else if (transaction.status !== TransactionStatus.FAILED) {
        // If it wasn't already marked as failed, update it
        await this.transactionService.update({
          identifierOptions: { _id: transaction.id },
          updatePayload: {
            status: TransactionStatus.FAILED,
            metadata: {
              ...transaction.metadata,
              paystackTransferCode: data.transfer_code,
              failureReason: data.reason,
            },
          },
          dbTransaction: { useTransaction: true, session },
        });
      }

      await session.commitTransaction();
    } catch (error) {
      console.error(`Error processing failed transfer: ${error.message}`);
      await session.abortTransaction();
    } finally {
      await session.endSession();
    }
  }

  /**
   * Handle reversed transfers
   */
  private async handleTransferReversed(data: any): Promise<void> {
    const reference = data.reference;

    // Find the transaction by reference
    const transaction = await this.transactionService.get({
      queryOptions: { reference },
    });

    if (!transaction) {
      console.warn(`Transaction with reference ${reference} not found`);
      return;
    }

    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      // Only process refund if it hasn't been refunded already
      if (transaction.status !== TransactionStatus.REVERSED) {
        // Get the wallet
        const wallet = await this.walletService.get({
          queryOptions: { _id: transaction.walletId },
        });

        if (!wallet) {
          console.error(`Wallet not found for transaction ${reference}`);
          await session.abortTransaction();
          return;
        }

        // Lock the wallet during the refund process
        const lockKey = `locks:wallet:${wallet.id}`;
        const ttl = 10000;
        const retryCount = 3;

        await this.redisService.acquireLockWithCbAndRetry(
          lockKey,
          ttl,
          retryCount,
          async () => {
            // Refund the amount to the wallet
            wallet.balance += transaction.amount;
            await wallet.save({ session });

            // Update the transaction status
            await this.transactionService.update({
              identifierOptions: { _id: transaction.id },
              updatePayload: {
                status: TransactionStatus.REVERSED,
                metadata: {
                  ...transaction.metadata,
                  paystackTransferCode: data.transfer_code,
                  reversalReason: data.reason,
                  reversedAt: new Date(),
                },
              },
              dbTransaction: { useTransaction: true, session },
            });

            console.log(`Processed reversal for transfer ${reference}`);
          },
        );
      }

      await session.commitTransaction();
    } catch (error) {
      console.error(`Error processing reversed transfer: ${error.message}`);
      await session.abortTransaction();
    } finally {
      await session.endSession();
    }
  }
}
