import { ApiProperty } from "@nestjs/swagger";
import { Expose, Exclude } from "class-transformer";
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsNumber,
  IsEnum,
} from "class-validator";
import { CurrencyType } from "../schemas/wallet.schema";

export class CreateWalletDto {
  @ApiProperty({ description: "User ID associated with the wallet" })
  @IsNotEmpty()
  @IsString()
  readonly userId: string;

  @ApiProperty({ description: "Initial balance of the wallet", default: 0 })
  @IsOptional()
  @IsNumber()
  readonly balance?: number;

  @ApiProperty({ description: "Currency of the wallet", default: "USD" })
  @IsOptional()
  @IsString()
  readonly currency?: string;
}

export class UpdateWalletDto {
  @ApiProperty({ description: "Balance of the wallet" })
  @IsOptional()
  @IsNumber()
  readonly balance?: number;

  @ApiProperty({ description: "Currency of the wallet" })
  @IsOptional()
  @IsString()
  readonly currency?: string;
}

export class FundWalletDto {
  @ApiProperty({ description: "Amount to fund the wallet" })
  @IsNumber()
  readonly amount?: number;

  @ApiProperty({ description: "Cuurency to fund the wallet" })
  @IsString()
  @IsEnum(CurrencyType)
  readonly currency?: string;
}

export class WalletResponseDto {
  @Expose()
  @ApiProperty()
  id: string;

  @Expose()
  @ApiProperty()
  userId: string;

  @Expose()
  @ApiProperty()
  balance: number;

  @Expose()
  @ApiProperty()
  currency: string;

  @Expose()
  @ApiProperty()
  createdAt: Date;

  @Expose()
  @ApiProperty()
  updatedAt: Date;

  @Exclude()
  isDeleted: boolean;
}
