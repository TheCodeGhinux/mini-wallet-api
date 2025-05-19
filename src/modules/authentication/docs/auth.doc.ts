import { applyDecorators } from "@nestjs/common";
import {
  ApiOperation,
  ApiBody,
  ApiResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import {
  ChangePasswordResponseDto,
  CreateUserResponseDto,
} from "../dtos/auth.dto";
import {
  BadRequestErrorResponseDto,
  NotFoundErrorResponseDto,
  UnauthorizedErrorResponseDto,
} from "@shared/dtos/response.dto";
import { CreateUserDto } from "@modules/user/dto/create-user.dto";
import { LoginUserDto } from "@modules/user/dto/login-user.dto";
import { ChangePasswordDto } from "@modules/user/dto/change-password.dto";

export class AuthDocs {
  static register() {
    return applyDecorators(
      ApiOperation({ summary: "User Register" }),
      ApiBody({ type: CreateUserDto }),
      ApiResponse({
        status: 201,
        description:
          "User created successfully. Please check your email for verification",
        type: CreateUserResponseDto,
      }),
      ApiBadRequestResponse({
        description: "User already exists or invalid request parameters",
        type: BadRequestErrorResponseDto,
      }),
      ApiBadRequestResponse({
        example: {
          message: "Bad Request",
          success: false,
        },
      }),
    );
  }
  static Login() {
    return applyDecorators(
      ApiOperation({ summary: "User Login" }),
      ApiBody({ type: LoginUserDto }),
      ApiResponse({
        status: 201,
        description: "User Logged in successfully",
        type: CreateUserResponseDto,
      }),
      ApiNotFoundResponse({
        description: "Invalid credentials",
        type: NotFoundErrorResponseDto,
      }),
      ApiNotFoundResponse({
        example: {
          message: "Invalid credentials",
          success: false,
        },
      }),
      ApiBadRequestResponse({
        description: "Invalid credentials",
        type: BadRequestErrorResponseDto,
      }),
      ApiBadRequestResponse({
        example: {
          message: "Invalid credentials",
          success: false,
        },
      }),
    );
  }

  static changePassword() {
    return applyDecorators(
      ApiOperation({ summary: "Change password" }),
      ApiBody({ type: ChangePasswordDto }),
      ApiResponse({
        status: 201,
        description: "Password changed successfully",
        type: ChangePasswordResponseDto,
      }),
      ApiBadRequestResponse({
        description: "Bad request error",
        example: {
          message: "Validation failed",
          success: false,
          errors: "Invalid credentials",
        },
      }),
      ApiUnauthorizedResponse({
        description: "Unauthorized error",
        type: UnauthorizedErrorResponseDto,
      }),
    );
  }
}
