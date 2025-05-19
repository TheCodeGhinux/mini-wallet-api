import { BaseModelAction } from "@database/base.model.action";
import { HttpStatus, Injectable } from "@nestjs/common";
import { TransactionDocument } from "./schemas/transaction.schema";
import { InjectModel } from "@nestjs/mongoose";
import { TRANSACTION } from "@database/schemas";
import { DBModel } from "@/types/db.model";
import { AuthUser } from "@middlewares/auth.guard";
import { CustomHttpException } from "@shared/exception.handler";
import * as SYS_MSG from "@shared/system.messages";

@Injectable()
export class TransactionsService extends BaseModelAction<TransactionDocument> {
  constructor(
    @InjectModel(TRANSACTION)
    private transactionModel: DBModel<TransactionDocument>,
  ) {
    super(transactionModel);
  }

  async findOne(user: AuthUser, payload: string) {
    const transaction = await this.get({
      queryOptions: { _id: payload, walletId: user.walletId },
    });

    if (!transaction) {
      throw new CustomHttpException(
        SYS_MSG.NOT_FOUND("transaction"),
        HttpStatus.NOT_FOUND,
      );
    }

    return transaction;
  }

  async findOneTransaction(user: AuthUser, id: string) {
    const transaction = await this.findOne(user, id);

    return {
      message: "Transaction  fecthed successfully",
      data: transaction,
    };
  }
}
