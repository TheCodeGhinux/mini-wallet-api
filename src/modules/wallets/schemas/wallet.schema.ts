import { BaseSchema, Schema } from "@database/base.schema";
import { USER } from "@database/schemas";
import { UserDocument } from "@modules/user/user.schema";
import { Prop, SchemaFactory } from "@nestjs/mongoose";
import { Document, SchemaTypes } from "mongoose";

export enum CurrencyType {
  NGN = "ngn",
  USD = "usd",
  GBP = "gbp",
  EUR = "eur",
}

@Schema()
export class Wallet extends BaseSchema {
  @Prop({ type: SchemaTypes.ObjectId, ref: USER, required: true })
  user: string | UserDocument;

  @Prop({ required: true, default: 0 })
  balance: number;

  @Prop({ required: true, default: "NGN" })
  currency: string;

  @Prop({ required: true })
  accountNumber: string;
}

export type WalletDocument = Wallet & Document;
export const WalletSchema = SchemaFactory.createForClass(Wallet);

WalletSchema.virtual("transactions", {
  ref: "Transaction",
  localField: "id",
  foreignField: "walletId",
});

// WalletSchema.pre<WalletDocument>("save", function (next: HookNextFunction) {
//   if (this.balance < 0) {
//     return next(new Error("Wallet balance cannot be negative"));
//   }
//   next();
// });
