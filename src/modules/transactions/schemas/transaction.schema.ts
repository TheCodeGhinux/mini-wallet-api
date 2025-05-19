import { BaseSchema, Schema } from "@database/base.schema";
import { Prop, SchemaFactory } from "@nestjs/mongoose";
import { Document, SchemaTypes } from "mongoose";

export enum TransactionType {
  CREDIT = "credit",
  DEBIT = "debit",
}

export enum TransactionStatus {
  PENDING = "pending",
  SUCCESS = "success",
  FAILED = "failed",
  REVERSED = "reversed",
}

@Schema()
export class Transaction extends BaseSchema {
  @Prop({ required: true, index: true })
  walletId: string;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true, enum: TransactionType })
  type: TransactionType;

  @Prop({ required: true })
  reference: string;

  @Prop({
    required: true,
    enum: TransactionStatus,
    default: TransactionStatus.PENDING,
  })
  status: TransactionStatus;

  @Prop({ type: SchemaTypes.Mixed, default: {} })
  metadata: Record<string, any>;
}

export type TransactionDocument = Transaction & Document;
export const TransactionSchema = SchemaFactory.createForClass(Transaction);

// TransactionSchema.post(
//   "save",
//   async function (doc: TransactionDocument, next: HookNextFunction) {
//     if (doc.status === TransactionStatus.SUCCESS) {
//       try {
//         const walletModel = mongoose.model("Wallet");
//         const wallet = await walletModel.findOne({ id: doc.walletId });

//         if (wallet) {
//           if (doc.type === TransactionType.CREDIT) {
//             wallet.balance += doc.amount;
//           } else if (doc.type === TransactionType.DEBIT) {
//             wallet.balance -= doc.amount;
//           }
//           await wallet.save();
//         }
//       } catch (error) {
//         console.error("Error updating wallet balance:", error);
//       }
//     }
//     next();
//   },
// );
