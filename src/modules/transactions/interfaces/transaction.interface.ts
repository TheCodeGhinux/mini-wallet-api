import {
  TransactionStatus,
  TransactionType,
} from "../schemas/transaction.schema";
import { CreateRecordOptionsGeneric } from "@database/options/create-record.generic";

export interface ITransaction {
  walletId: string;
  amount: number;
  type?: TransactionType;
  reference?: string;
  status?: TransactionStatus;
}

export type CreateTransactionRecordOptions =
  CreateRecordOptionsGeneric<ITransaction>;
