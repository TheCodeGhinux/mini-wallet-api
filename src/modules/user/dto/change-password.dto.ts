import { ApiProperty } from "@nestjs/swagger";
import { IsString, MinLength } from "class-validator";

export class ChangePasswordDto {
  @ApiProperty({
    example: "SecureP@ss123",
    description: "User password",
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  oldPassword: string;

  @ApiProperty({
    example: "SecureP@ss123",
    description: "User password",
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  newPassword: string;
}
