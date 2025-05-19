import { Module } from "@nestjs/common";
import { AuthenticationService } from "./authentication.service";
import { AuthenticationController } from "./authentication.controller";
import { UserModule } from "@modules/user/user.module";
import { Connection } from "mongoose";
import { MongooseModule } from "@nestjs/mongoose";
import { OtpSchema } from "./schemas/otp.schema";
import { OtpService } from "./otp.service";
import { TokenService } from "@helpers/jwt.token.service";
import { WalletsModule } from "@modules/wallets/wallets.module";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: "Otp", schema: OtpSchema }]),
    UserModule,
    WalletsModule,
  ],
  controllers: [AuthenticationController],
  providers: [AuthenticationService, Connection, OtpService, TokenService],
  exports: [AuthenticationService],
})
export default class AuthenticationModule {}
