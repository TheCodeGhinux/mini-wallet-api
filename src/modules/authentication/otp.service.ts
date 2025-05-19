import { Injectable, BadRequestException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { OtpDocument } from "./schemas/otp.schema";
import { BaseModelAction } from "@database/base.model.action";
import { DBModel } from "@/types/db.model";
import numberStringGenerator from "@shared/numberStringGenerator";

@Injectable()
export class OtpService extends BaseModelAction<OtpDocument> {
  constructor(@InjectModel("Otp") otpModel: DBModel<OtpDocument>) {
    super(otpModel);
  }

  async generateOtp(
    userId: string,
    tokenType: string,
    expiryDuration: number,
  ): Promise<OtpDocument> {
    const expiry = new Date(Date.now() + expiryDuration);
    const token = numberStringGenerator({
      characterLength: 6,
      outputOption: "numeric",
    });
    const otpData = { userId, tokenType, token, isUsed: false, expiry };
    return this.create({
      createPayload: otpData,
      dbTransaction: { useTransaction: false },
    });
  }

  async validateOtp(
    userId: string,
    tokenType: string,
    token: string,
  ): Promise<boolean> {
    const otp = await this.get({
      queryOptions: {
        userId,
        tokenType,
        token,
        isUsed: false,
        expiry: { $gt: new Date() },
      },
    });
    if (!otp) {
      throw new BadRequestException("Invalid or expired OTP");
    }
    await this.update({
      identifierOptions: { _id: otp._id },
      updatePayload: { isUsed: true },
      dbTransaction: { useTransaction: false },
    });
    return true;
  }

  async invalidateOtp(userId: string, tokenType: string): Promise<void> {
    await this.update({
      identifierOptions: { userId, tokenType, isUsed: false },
      updatePayload: { isUsed: true },
      dbTransaction: { useTransaction: false },
    });
  }
}
