import { BaseSchema, Schema } from "@database/base.schema";
import { Document } from "mongoose";
import { SchemaFactory } from "@nestjs/mongoose";

@Schema()
export class Authentication extends BaseSchema {}

export type AuthenticationDocument = Authentication & Document;
export const authenticationSchema =
  SchemaFactory.createForClass(Authentication);
