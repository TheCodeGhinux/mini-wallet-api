import {
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
} from "@nestjs/common";
import { InjectConnection, InjectModel } from "@nestjs/mongoose";
import { DBModel } from "@/types/db.model";
import { CurrencyType, WalletDocument } from "./schemas/wallet.schema";
import { WALLET } from "@database/schemas";
import { BaseModelAction } from "@database/base.model.action";
import {
  IFundWallet,
  ITransferFunds,
  IWallet,
} from "./interfaces/wallet.interface";
import { ClientSession, Connection } from "mongoose";
import { CustomHttpException } from "@shared/exception.handler";
import * as SYS_MSG from "@shared/system.messages";
import { TransactionsService } from "@modules/transactions/transactions.service";
import { generateTransactionReference } from "@helpers/reference-generator";
import { AuthUser } from "@middlewares/auth.guard";
import { RedisService } from "src/redis/redis.service";
import {
  TransactionStatus,
  TransactionType,
} from "@modules/transactions/schemas/transaction.schema";

@Injectable()
export class WalletsService extends BaseModelAction<WalletDocument> {
  constructor(
    @InjectModel(WALLET) private walletModel: DBModel<WalletDocument>,
    @InjectConnection() private readonly connection: Connection,
    private readonly transactionService: TransactionsService,
    private readonly redisService: RedisService,
  ) {
    super(walletModel);
  }

  async createOrFindWallet(user: AuthUser, payload: IWallet) {
    const session: ClientSession = await this.connection.startSession();
    try {
      session.startTransaction();
      let wallet = await this.get({
        queryOptions: { user: user.sub },
        relations: ["transactions"],
      });

      if (!wallet) {
        const accountNumber = await this.generateAccountNumber(
          payload.currency,
        );
        wallet = await this.create({
          createPayload: {
            ...payload,
            user: user.sub,
            accountNumber: accountNumber,
          },
          dbTransaction: { useTransaction: true, session },
        });

        await wallet.save({ session });
      }

      await session.commitTransaction();
      await session.endSession();
      return {
        message: "Wallet created successfully",
        data: wallet,
      };
    } catch (error) {
      console.error(error.message);
      await session.abortTransaction();
      await session.endSession();
      throw new InternalServerErrorException(SYS_MSG.INTERNAL_SERVER_ERROR);
    }
  }

  async getWalletBalance(user: AuthUser) {
    console.log("User wallet: ", user);
    const wallet = await this.get({
      queryOptions: {
        user: user.sub,
        isDeleted: false,
      },
    });
    if (!wallet) {
      throw new CustomHttpException(
        SYS_MSG.NOT_FOUND("wallet"),
        HttpStatus.NOT_FOUND,
      );
    }

    return {
      message: "Wallet balance fecthed successfully",
      data: { balance: wallet.balance },
    };
  }

  async fundWallet(user: AuthUser, payload: IFundWallet) {
    if (payload.amount <= 0) {
      throw new CustomHttpException(
        "Amount must be > 0",
        HttpStatus.BAD_REQUEST,
      );
    }
    const wallet = await this.get({
      queryOptions: {
        user: user.sub,
        currency: payload.currency,
        isDeleted: false,
      },
    });
    if (!wallet) {
      throw new CustomHttpException(
        SYS_MSG.NOT_FOUND("wallet"),
        HttpStatus.NOT_FOUND,
      );
    }
    const reference = generateTransactionReference(user.sub);
    const resource = `locks:wallet:${wallet.id}`;
    const ttl = 5000;
    const retryCount = 3;

    return this.redisService.acquireLockWithCbAndRetry(
      resource,
      ttl,
      retryCount,
      async () => {
        const session: ClientSession = await this.connection.startSession();
        session.startTransaction();
        try {
          // const wallet = await this.connection
          //   .model<WalletDocument>("Wallet")
          //   .findOne({ id: wallet.id, isDeleted: false })
          //   .session(session)
          //   .exec();

          const existingReference = await this.transactionService.get({
            queryOptions: { reference },
          });
          if (existingReference) {
            throw new CustomHttpException(
              "Duplicate transaction reference",
              HttpStatus.CONFLICT,
            );
          }
          wallet.balance += payload.amount;
          await wallet.save({ session });

          const metadata = {
            performedBy: user.sub,
            action: "fund",
            timestamp: new Date().toISOString(),
            payload: { walletId: wallet.id, amount: payload.amount },
          };

          await this.transactionService.create({
            createPayload: {
              walletId: wallet.id,
              amount: payload.amount,
              type: TransactionType.CREDIT,
              reference: reference,
              status: TransactionStatus.SUCCESS,
              metadata: metadata,
            },
            dbTransaction: { useTransaction: true, session },
          });

          await session.commitTransaction();
          return {
            message: "Wallet funded successfully",
            data: wallet,
          };
        } catch (err) {
          await session.abortTransaction();
          try {
            await this.transactionService.create({
              createPayload: {
                walletId: wallet.id,
                amount: payload.amount,
                type: TransactionType.CREDIT,
                reference,
                status: TransactionStatus.FAILED,
                metadata: {
                  performedBy: user.sub,
                  action: "fund",
                  timestamp: new Date().toISOString(),
                  error: err.message,
                  payload: {
                    walletId: wallet.id,
                    amount: payload.amount,
                  },
                },
              },
              dbTransaction: { useTransaction: false },
            });
          } catch {
            console.error(err);
          }
          if (
            err instanceof CustomHttpException ||
            err instanceof HttpException
          ) {
            throw err;
          }

          throw new InternalServerErrorException(err.message);
        } finally {
          await session.endSession();
        }
      },
    );
  }

  async transferFunds(user: AuthUser, payload: ITransferFunds): Promise<any> {
    if (payload.amount <= 0) {
      throw new CustomHttpException(
        "Amount must be > 0",
        HttpStatus.BAD_REQUEST,
      );
    }

    const wallet = await this.get({
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

    const reference = generateTransactionReference(user.sub);
    const resources = [
      `locks:wallet:${wallet.id}`,
      `locks:wallet:${payload.targetAccountNumber}`,
    ].sort();
    const resourceKey = resources.join(",");
    const ttl = 10000;
    const retryCount = 3;
    const action = "transfer";

    return this.redisService.acquireLockWithCbAndRetry(
      resourceKey,
      ttl,
      retryCount,
      async () => {
        const session: ClientSession = await this.connection.startSession();
        session.startTransaction();

        try {
          // Debit source
          const source = await this.get({
            queryOptions: {
              user: user.sub,
              isDeleted: false,
            },
          });

          source.balance -= payload.amount;
          await source.save({ session });

          // Prevent duplicate reference
          if (
            await this.transactionService.get({ queryOptions: { reference } })
          ) {
            throw new CustomHttpException(
              "Duplicate transaction reference",
              HttpStatus.CONFLICT,
            );
          }

          const baseMeta = {
            performedBy: user.sub,
            action,
            timestamp: new Date().toISOString(),
            payload: {
              source: source.id,
              acoountNumber: source.accountNumber,
              amount: payload.amount,
            },
          };

          await this.transactionService.create({
            createPayload: {
              walletId: source.id,
              amount: payload.amount,
              type: TransactionType.DEBIT,
              reference,
              status: TransactionStatus.SUCCESS,
              metadata: baseMeta,
            },
            dbTransaction: { useTransaction: true, session },
          });

          // Credit urce account
          const recipient = await this.get({
            queryOptions: {
              accountNumber: payload.targetAccountNumber,
              isDeleted: false,
            },
          });

          if (!recipient) {
            throw new CustomHttpException(
              "urce wallet not found",
              HttpStatus.NOT_FOUND,
            );
          }

          recipient.balance += payload.amount;
          await recipient.save({ session });
          const debitTxn = await this.transactionService.create({
            createPayload: {
              walletId: source.id,
              amount: payload.amount,
              type: TransactionType.DEBIT,
              reference,
              status: TransactionStatus.SUCCESS,
              metadata: baseMeta,
            },
            dbTransaction: { useTransaction: true, session },
          });

          await this.transactionService.create({
            createPayload: {
              walletId: source.id,
              amount: payload.amount,
              type: TransactionType.CREDIT,
              reference,
              status: TransactionStatus.SUCCESS,
              metadata: baseMeta,
            },
            dbTransaction: { useTransaction: true, session },
          });

          await session.commitTransaction();

          return {
            message: "Wallet transfer successful",
            data: {
              wallet: source,
              transaction: debitTxn,
            },
          };
        } catch (err) {
          await session.abortTransaction();
          // Log failed transaction
          try {
            await this.transactionService.create({
              createPayload: {
                walletId: wallet.id,
                amount: payload.amount,
                type: TransactionType.DEBIT,
                reference,
                status: TransactionStatus.FAILED,
                metadata: {
                  performedBy: user.sub,
                  action,
                  timestamp: new Date().toISOString(),
                  error: err.message,
                  payload: {
                    source: wallet.id,
                    recipient: payload.targetAccountNumber,
                    amount: payload.amount,
                  },
                },
              },
              dbTransaction: { useTransaction: false },
            });
          } catch {
            console.error(err.message);
          }

          if (
            err instanceof CustomHttpException ||
            err instanceof HttpException
          ) {
            throw err;
          }

          throw new InternalServerErrorException(err.message);
        } finally {
          await session.endSession();
        }
      },
    );
  }

  // async transferFunds(user: AuthUser, payload: ITransferFunds): Promise<void> {
  //   if (payload.amount <= 0) {
  //     throw new CustomHttpException(
  //       "Amount must be > 0",
  //       HttpStatus.BAD_REQUEST,
  //     );
  //   }
  //   const reference = generateTransactionReference(user.sub);
  //   const resources = [
  //     `locks:wallet:${payload.sourceWalletId}`,
  //     `locks:wallet:${payload.urceWalletId}`,
  //   ].sort();
  //   const resourceKey = resources.join(",");
  //   const ttl = 10000;
  //   const retryCount = 3;
  //   const action = "transfer";

  //   await this.redisService.acquireLockWithCbAndRetry(
  //     resourceKey,
  //     ttl,
  //     retryCount,
  //     async () => {
  //       const session: ClientSession = await this.connection.startSession();
  //       session.startTransaction();
  //       // const WalletModel = this.connection.model<WalletDocument>("Wallet");
  //       try {
  //         // Debit source
  //         // const source = await WalletModel.findOne({
  //         //   id: payload.sourceWalletId,
  //         //   isDeleted: false,
  //         // })
  //         //   .session(session)
  //         //   .exec();
  //         // Debit source account
  //         const source = await this.get({
  //           queryOptions: {
  //             _id: payload.sourceWalletId,
  //             user: user.sub,
  //             isDeletd: false,
  //           },
  //         });
  //         if (!source || source.balance < payload.amount) {
  //           throw new CustomHttpException(
  //             "Insufficient funds",
  //             HttpStatus.BAD_REQUEST,
  //           );
  //         }
  //         source.balance -= payload.amount;
  //         await source.save({ session });

  //         if (
  //           await this.transactionService.get({ queryOptions: { reference } })
  //         ) {
  //           throw new CustomHttpException(
  //             "Duplicate transaction reference",
  //             HttpStatus.CONFLICT,
  //           );
  //         }

  //         const baseMeta = {
  //           performedBy: user.sub,
  //           action,
  //           timestamp: new Date().toISOString(),
  //           payload: {
  //             source: payload.sourceWalletId,
  //             urce: payload.urceWalletId,
  //             amount: payload.amount,
  //           },
  //         };

  //         await this.transactionService.create({
  //           createPayload: {
  //             walletId: payload.sourceWalletId,
  //             amount: payload.amount,
  //             type: TransactionType.DEBIT,
  //             reference,
  //             status: TransactionStatus.SUCCESS,
  //             metadata: baseMeta,
  //           },
  //           dbTransaction: { useTransaction: true, session },
  //         });

  //         // Credit urce account
  //         const urce = await this.get({
  //           queryOptions: {
  //             id: payload.urceWalletId,
  //             isDeleted: false,
  //           },
  //         });
  //         if (!urce) {
  //           throw new CustomHttpException(
  //             "urce wallet not found",
  //             HttpStatus.NOT_FOUND,
  //           );
  //         }
  //         urce.balance += payload.amount;
  //         await urce.save({ session });

  //         await this.transactionService.create({
  //           createPayload: {
  //             walletId: payload.urceWalletId,
  //             amount: payload.amount,
  //             type: TransactionType.CREDIT,
  //             reference,
  //             status: TransactionStatus.SUCCESS,
  //             metadata: baseMeta,
  //           },
  //           dbTransaction: { useTransaction: true, session },
  //         });

  //         await session.commitTransaction();
  //       } catch (err) {
  //         await session.abortTransaction();
  //         // Log failed transfer transaction
  //         try {
  //           await this.transactionService.create({
  //             createPayload: {
  //               walletId: payload.sourceWalletId,
  //               amount: payload.amount,
  //               type: TransactionType.DEBIT,
  //               reference,
  //               status: TransactionStatus.FAILED,
  //               metadata: {
  //                 performedBy: user.sub,
  //                 action,
  //                 timestamp: new Date().toISOString(),
  //                 error: err.message,
  //                 payload: {
  //                   source: payload.sourceWalletId,
  //                   urce: payload.urceWalletId,
  //                   amount: payload.amount,
  //                 },
  //               },
  //             },
  //             dbTransaction: { useTransaction: false },
  //           });
  //         } catch {
  //           console.error(err.message);
  //         }
  //         if (
  //           err instanceof CustomHttpException ||
  //           err instanceof HttpException
  //         ) {
  //           throw err;
  //         }

  //         throw new InternalServerErrorException(err.message);
  //       } finally {
  //         await session.endSession();
  //       }
  //     },
  //   );
  // }

  async findWalletById(id: string) {
    const wallet = await this.get({
      queryOptions: { _id: id, isDeleted: false },
    });

    if (!wallet) {
      throw new CustomHttpException(
        SYS_MSG.NOT_FOUND("wallet"),
        HttpStatus.NOT_FOUND,
      );
    }
    return wallet;
  }

  async findUserWallet(user: AuthUser) {
    const wallet = await this.get({
      queryOptions: { user: user.sub, isDeleted: false },
    });

    if (!wallet) {
      throw new CustomHttpException(
        SYS_MSG.NOT_FOUND("wallet"),
        HttpStatus.NOT_FOUND,
      );
    }
    return { message: "User wallet fetched sucessfully", data: wallet };
  }

  async generateAccountNumber(currency: string): Promise<string> {
    let accountNumber = "";
    let isUnique = false;

    let prefix = "6864";
    switch (currency) {
      case CurrencyType.NGN:
        prefix = "6861";
        break;
      case CurrencyType.USD:
        prefix = "6862";
        break;
      case CurrencyType.EUR:
        prefix = "6863";
        break;
    }

    while (!isUnique) {
      const randomPart = Math.floor(Math.random() * 1000000)
        .toString()
        .padStart(6, "0");
      accountNumber = `${prefix}${randomPart}`;

      const existingWallet = await this.get({
        queryOptions: { accountNumber: accountNumber, isDeleted: false },
      });

      if (!existingWallet) {
        isUnique = true;
      }
    }

    return accountNumber;
  }
}
