import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Post,
  RawBodyRequest,
  Req,
  UnauthorizedException,
  Headers as HeadersDecorator,
} from "@nestjs/common";
import { TransferService } from "./transfer.service";
import { CurrentUser } from "@decorators/currentUser.decorator";
import { AuthUser } from "@middlewares/auth.guard";
import { InitiateTransferDto, WebhookDto } from "./dots/transfer.dto";
import { PaystackService } from "./provider/paystack.service";
import { SkipAuth } from "@decorators/skip-auth.decorator";

@Controller("transfer")
export class TransferController {
  constructor(
    private readonly transferService: TransferService,
    private readonly paystackService: PaystackService,
  ) {}

  @Post("bank")
  async externalTransfer(
    @CurrentUser() user: AuthUser,
    @Body() payload: InitiateTransferDto,
  ) {
    return this.transferService.initiateExternalTransfer(user, payload);
  }

  @Get("banks")
  async getBankList() {
    return await this.paystackService.getBankList();
  }

  @Post("webhook")
  @SkipAuth()
  @Post("webhook")
  @SkipAuth()
  async handlePaystackWebhook(
    @HeadersDecorator("x-paystack-signature") signature: string,
    @Req() req: RawBodyRequest<Request>,
    @Body() payload: WebhookDto,
  ) {
    const rawBody = req.rawBody
      ? req.rawBody.toString()
      : JSON.stringify(payload);

    const isVerified = this.paystackService.verifyWebhookSignature(
      signature,
      rawBody,
    );

    if (!signature || !isVerified) {
      throw new UnauthorizedException("Invalid webhook signature");
    }

    await this.paystackService.handleWebhookEvent(payload.event, payload.data);

    return {
      status: HttpStatus.OK,
      message: "Webhook processed successfully",
    };
  }
  // @Get("status/:reference")
  // async getTransferStatus(
  //   @CurrentUser() user: AuthUser,
  //   @Param('reference') reference: string,
  // ) {
  //   return this.transferService.getTransferStatus(reference, user);
  // }
}
