import { Module } from "@nestjs/common";
import { UserService } from "./user.service";
import { MongooseModule } from "@nestjs/mongoose";
import { UserSchema } from "./user.schema";
import { USER } from "@database/schemas";

@Module({
  imports: [MongooseModule.forFeature([{ name: USER, schema: UserSchema }])],
  controllers: [],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
