import { ApiProperty } from "@nestjs/swagger";
import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
} from "class-validator";
import {
  TransactionType,
  TransactionStatus,
} from "../schemas/transaction.schema";
import { Exclude, Expose } from "class-transformer";

export class CreateTransactionDto {
  @ApiProperty({ description: "ID of the wallet for this transaction" })
  @IsNotEmpty()
  @IsString()
  readonly walletId: string;

  @ApiProperty({ description: "Amount for the transaction" })
  @IsNotEmpty()
  @IsNumber()
  readonly amount: number;

  @ApiProperty({ description: "Type of transaction", enum: TransactionType })
  @IsNotEmpty()
  @IsEnum(TransactionType)
  readonly type: TransactionType;

  @ApiProperty({ description: "Reference for the transaction" })
  @IsNotEmpty()
  @IsString()
  readonly reference: string;

  @ApiProperty({
    description: "Status of the transaction",
    enum: TransactionStatus,
    default: TransactionStatus.PENDING,
  })
  @IsOptional()
  @IsEnum(TransactionStatus)
  readonly status?: TransactionStatus;
}

export class UpdateTransactionDto {
  @ApiProperty({
    description: "Status of the transaction",
    enum: TransactionStatus,
  })
  @IsOptional()
  @IsEnum(TransactionStatus)
  readonly status?: TransactionStatus;
}

export class TransactionResponseDto {
  @Expose()
  @ApiProperty()
  id: string;

  @Expose()
  @ApiProperty()
  walletId: string;

  @Expose()
  @ApiProperty()
  amount: number;

  @Expose()
  @ApiProperty({ enum: TransactionType })
  type: TransactionType;

  @Expose()
  @ApiProperty()
  reference: string;

  @Expose()
  @ApiProperty({ enum: TransactionStatus })
  status: TransactionStatus;

  @Expose()
  @ApiProperty()
  createdAt: Date;

  @Expose()
  @ApiProperty()
  updatedAt: Date;

  @Exclude()
  isDeleted: boolean;
}
