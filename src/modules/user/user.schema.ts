import { BaseSchema, Schema } from "@database/base.schema";
import { Prop, SchemaFactory } from "@nestjs/mongoose";
import { IsEnum } from "class-validator";
import { Document, SchemaTypes } from "mongoose";

export enum ROLE_ENUM {
  ADMIN = "admin",
  STUDENT = "student",
}

@Schema()
export class User extends BaseSchema {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  password: string;

  @Prop({ type: SchemaTypes.String, default: ROLE_ENUM.STUDENT })
  @IsEnum(ROLE_ENUM)
  role: ROLE_ENUM;

  @Prop({
    type: SchemaTypes.Date,
    default: new Date(),
  })
  lastLoggedIn: Date;

  @Prop({
    type: SchemaTypes.Number,
    default: 0,
  })
  loginAttempts: number;

  @Prop({
    type: SchemaTypes.Boolean,
    default: true,
  })
  isActive: boolean;

  @Prop({ type: SchemaTypes.Number, default: 0 })
  xp: number;
}

export type UserDocument = User & Document;

export const UserSchema = SchemaFactory.createForClass(User);
