import { BaseSchema, Schema } from "@database/base.schema";
import { Prop, SchemaFactory } from "@nestjs/mongoose";
import { Document, SchemaTypes } from "mongoose";

@Schema()
export class Otp extends BaseSchema {
  @Prop({ type: SchemaTypes.String, required: true })
  userId: string;

  @Prop({ type: SchemaTypes.String, required: true })
  token: string;

  @Prop({ type: SchemaTypes.String, required: true })
  tokenType: string;

  @Prop({ type: SchemaTypes.Boolean, default: false })
  isUsed: boolean;

  @Prop({ type: SchemaTypes.Date, required: true })
  expiry: Date;
}

export type OtpDocument = Otp & Document;

export const OtpSchema = SchemaFactory.createForClass(Otp);
