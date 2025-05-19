import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsEmail, MinLength } from "class-validator";

export class CreateUserDto {
  @ApiProperty({
    example: "user@example.com",
    description: "Valid email address of the user",
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: "John Doe",
    description: "Full name of the user",
    minLength: 2,
  })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({
    example: "SecureP@ss123",
    description: "User password",
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  password: string;
}
