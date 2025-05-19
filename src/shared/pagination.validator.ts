import { IsOptional, IsString } from "class-validator";

export default class PaginationValidator {
  @IsOptional()
  @IsString()
  page?: number;

  @IsString()
  @IsOptional()
  limit?: number;
}
