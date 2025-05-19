import { PartialType } from '@nestjs/swagger';
import { CreateWalletDto } from './wallet.dto';

export class UpdateWalletDto extends PartialType(CreateWalletDto) {}
