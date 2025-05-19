import { ApiProperty } from "@nestjs/swagger";

export class UserDto {
  @ApiProperty({ example: "67edcc4570ca8c2ecb30fc3a" })
  id: string;

  @ApiProperty({ example: "Kristina Hodkiewicz" })
  name: string;

  @ApiProperty({ example: "Elisha49@hotmail.com" })
  email: string;

  @ApiProperty({ example: "student" })
  role: string;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: false })
  isDeleted: boolean;

  @ApiProperty({ example: "2025-04-02T23:42:09.416Z" })
  lastLoggedIn: string;

  @ApiProperty({ example: 0 })
  loginAttempts: number;

  @ApiProperty({ example: "2025-04-02T23:46:13.911Z" })
  createdAt: string;

  @ApiProperty({ example: "2025-04-02T23:46:13.911Z" })
  updatedAt: string;
}

export class UserResponseDataDto {
  @ApiProperty({ example: "{{vault:json-web-token}}" })
  accessToken: string;

  @ApiProperty({ type: UserDto })
  user: UserDto;
}

export class CreateUserResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: "User created successfully" })
  message: string;

  @ApiProperty({ type: UserResponseDataDto })
  data: UserResponseDataDto;
}

export class ChangePasswordResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: "Password changed successfully" })
  message: string;
}
