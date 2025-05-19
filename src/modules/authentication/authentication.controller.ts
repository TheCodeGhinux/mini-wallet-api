import { Body, Controller, Get, Patch, Post } from "@nestjs/common";
import { AuthenticationService } from "./authentication.service";
import { CreateUserDto } from "@modules/user/dto/create-user.dto";
import { SkipAuth } from "@decorators/skip-auth.decorator";
import { LoginUserDto } from "@modules/user/dto/login-user.dto";
import { ChangePasswordDto } from "@modules/user/dto/change-password.dto";
import { CurrentUser } from "@decorators/currentUser.decorator";
import { AuthUser } from "@middlewares/auth.guard";
import { AuthDocs } from "./docs/auth.doc";

@Controller("auth")
export class AuthenticationController {
  constructor(private readonly authenticationService: AuthenticationService) {}

  @SkipAuth()
  @AuthDocs.register()
  @Post("register")
  async registerUser(@Body() payload: CreateUserDto) {
    return this.authenticationService.registerUser(payload);
  }

  @SkipAuth()
  @AuthDocs.Login()
  @Post("login")
  async loginUser(@Body() payload: LoginUserDto) {
    return this.authenticationService.loginUser(payload);
  }

  @AuthDocs.Login()
  @Get("me")
  async me(@CurrentUser() user: AuthUser) {
    return this.authenticationService.getCurrentUser(user);
  }

  @SkipAuth()
  @Post("google")
  async googleAuth(@Body() idToken: { idToken: string }) {
    return this.authenticationService.googleAuth(idToken);
  }

  @AuthDocs.changePassword()
  @Patch("change-password")
  async changePassword(
    @Body() payload: ChangePasswordDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.authenticationService.changePassword(payload, user.sub);
  }

  @SkipAuth()
  @Post("forgot-password")
  async forgotPassword(@Body() payload: { email: string }) {
    return this.authenticationService.sendForgotPasswordMail(payload.email);
  }

  @Post("reset-password")
  async resetPassword(@Body() payload: { password: string; token: string }) {
    return this.authenticationService.resetPassword(payload);
  }
}
