import { Controller, Get, Post, Body } from "@nestjs/common";
import { WalletsService } from "./wallets.service";
import { CreateWalletDto, FundWalletDto } from "./dto/wallet.dto";
import { IWallet } from "./interfaces/wallet.interface";
import { CurrentUser } from "@decorators/currentUser.decorator";
import { AuthUser } from "@middlewares/auth.guard";

@Controller("wallet")
export class WalletsController {
  constructor(private readonly walletsService: WalletsService) {}

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateWalletDto) {
    const payload: IWallet = { currency: dto.currency };
    return this.walletsService.createOrFindWallet(user, payload);
  }

  @Post("fund")
  fundWallet(@CurrentUser() user: AuthUser, @Body() dto: FundWalletDto) {
    return this.walletsService.fundWallet(user, {
      amount: dto.amount,
      currency: dto.currency,
    });
  }

  @Get()
  getWallet(@CurrentUser() user: AuthUser) {
    return this.walletsService.findUserWallet(user);
  }

  @Get("balance")
  getWalletBalance(@CurrentUser() user: AuthUser) {
    return this.walletsService.getWalletBalance(user);
  }
}
