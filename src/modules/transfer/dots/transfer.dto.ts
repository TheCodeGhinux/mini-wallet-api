import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsNotEmpty, IsNumber } from "class-validator";

export class InitiatePaystackTransferDto {
  @ApiProperty({ example: "Recipient Name" })
  @IsString()
  @IsNotEmpty()
  recipientName: string;

  @ApiProperty({ example: "0220000001" })
  @IsString()
  @IsNotEmpty()
  accountNumber: string;

  @ApiProperty({ example: "058" })
  @IsString()
  @IsNotEmpty()
  bankCode: string;

  @ApiProperty({ example: 5000 })
  @IsNumber()
  amount: number;

  @ApiProperty({ example: "Test transfer to user" })
  @IsString()
  reason: string;
}

export class InitiateTransferDto {
  // @ApiProperty({ example: "Recipient Name" })
  // @IsString()
  // @IsNotEmpty()
  // recipientName: string;

  @ApiProperty({ example: "0220000001" })
  @IsString()
  @IsNotEmpty()
  accountNumber: string;

  @ApiProperty({ example: "058" })
  @IsString()
  @IsNotEmpty()
  bankCode: string;

  @ApiProperty({ example: 5000 })
  @IsNumber()
  amount: number;

  @ApiProperty({ example: "Test transfer to user" })
  @IsString()
  reason: string;

  @ApiProperty({ example: "Test transfer to user" })
  @IsString()
  reference: string;
}

export class WebhookDto {
  @IsString()
  @IsNotEmpty()
  event: string;

  @IsNotEmpty()
  data: any;
}
