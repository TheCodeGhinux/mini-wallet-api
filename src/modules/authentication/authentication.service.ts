import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
  UnprocessableEntityException,
} from "@nestjs/common";
import { UserService } from "@modules/user/user.service";
import { CreateUserDto } from "@modules/user/dto/create-user.dto";
import CreateUserRecordOptions from "@modules/user/interfaces/create-user.interface";
import * as bcrypt from "bcrypt";
import { LoginUserDto } from "@modules/user/dto/login-user.dto";
import { GoogleAuthPayload } from "./interfaces/google-auth-payload.interface";
import { TokenPayload } from "./interfaces/google-auth-response-payload.interface";
import { ClientSession, Connection } from "mongoose";
import { INTERNAL_SERVER_ERROR } from "@shared/system.messages";
import { InjectConnection } from "@nestjs/mongoose";
import { ChangePasswordDto } from "@modules/user/dto/change-password.dto";
import { OtpService } from "./otp.service";
import { TokenService } from "@helpers/jwt.token.service";
import { AuthUser } from "@middlewares/auth.guard";
import { WalletsService } from "@modules/wallets/wallets.service";
import { CurrencyType } from "@modules/wallets/schemas/wallet.schema";
import * as SYS_MSG from "@shared/system.messages";

@Injectable()
export class AuthenticationService {
  constructor(
    private readonly userService: UserService,
    private readonly tokenService: TokenService,
    @InjectConnection() private readonly connection: Connection,
    private readonly otpService: OtpService,
    private readonly walletService: WalletsService,
  ) {}

  async registerUser(payload: CreateUserDto) {
    const hashedPassword = await bcrypt.hash(payload.password, 10);
    const userExists = await this.userService.get({
      queryOptions: { email: payload.email },
    });
    if (userExists !== null) {
      throw new BadRequestException("User already exists");
    }
    const session = await this.connection.startSession();
    try {
      session.startTransaction();
      const createUserPayload: CreateUserRecordOptions = {
        createPayload: {
          ...payload,
          password: hashedPassword,
        },
        dbTransaction: {
          useTransaction: true,
          session,
        },
      };
      const createdUser = await this.userService.createUser(createUserPayload);
      await session.commitTransaction();
      await session.endSession();

      const tokenPayload = {
        email: createdUser.email,
        sub: createdUser.id,
        name: createdUser.name,
      };
      const token = this.tokenService.signToken(tokenPayload);
      const responsePayload = {
        accessToken: token,
        user: createdUser,
      };
      return { data: responsePayload, message: "User created successfully" };
    } catch (userCreationError) {
      console.log(
        "🧨 AuthenticationService ~ registerUser ~ userCreationError",
        userCreationError,
      );
      await session.abortTransaction();
      await session.endSession();
      throw new InternalServerErrorException(INTERNAL_SERVER_ERROR);
    }
  }

  async changePassword(payload: ChangePasswordDto, userId: string) {
    const user = await this.userService.get({ queryOptions: { _id: userId } });
    if (user === null) {
      throw new BadRequestException("Invalid credentials");
    }
    const isValidPassword = await bcrypt.compare(
      payload.oldPassword,
      user.password,
    );
    if (isValidPassword === false) {
      throw new UnauthorizedException("Invalid credentials");
    }
    const hashedPassword = await bcrypt.hash(payload.newPassword, 10);
    await this.userService.update({
      updatePayload: { password: hashedPassword },
      identifierOptions: { _id: userId },
      dbTransaction: { useTransaction: false },
    });
    return { message: "Password changed successfully" };
  }

  async loginUser(payload: LoginUserDto) {
    const user = await this.userService.findUserByEmail(payload.email);

    if (user === null) {
      throw new UnauthorizedException("Invalid credentials");
    }
    const isValidPassword = await bcrypt.compare(
      payload.password,
      user.password,
    );
    if (isValidPassword === false) {
      await this.userService.update({
        updatePayload: { loginAttempts: user.loginAttempts + 1 },
        identifierOptions: { _id: user.id },
        dbTransaction: { useTransaction: false },
      });

      throw new UnauthorizedException("Invalid credentials");
    }

    const session: ClientSession = await this.connection.startSession();
    try {
      await this.userService.update({
        updatePayload: { lastLoggedIn: new Date() },
        identifierOptions: { _id: user.id },
        dbTransaction: { useTransaction: false },
      });

      const tokenPayload = { email: user.email, sub: user.id, name: user.name };
      const token = this.tokenService.signToken(tokenPayload);
      const responsePayload = {
        accessToken: token,
        user,
      };

      const walletUser: AuthUser = {
        sub: user.id,
        email: user.email,
      };

      const { data: wallet } = await this.walletService.createOrFindWallet(
        walletUser,
        {
          currency: CurrencyType.NGN,
        },
      );
      return {
        data: { ...responsePayload, wallet },
        message: "User logged in successfully",
      };
    } catch (error) {
      console.error(error.message);
      await session.abortTransaction();
      await session.endSession();
      throw new InternalServerErrorException(SYS_MSG.INTERNAL_SERVER_ERROR);
    }
  }

  async loginAdminUser(payload: LoginUserDto) {
    const user = await this.userService.findUserByEmail(payload.email);

    if (user === null) {
      throw new UnauthorizedException("Invalid credentials");
    }
    const isValidPassword = await bcrypt.compare(
      payload.password,
      user.password,
    );
    if (!isValidPassword) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const tokenPayload = { email: user.email, sub: user.id, name: user.name };
    const token = this.tokenService.signToken(tokenPayload);
    const responsePayload = {
      accessToken: token,
      user,
    };
    return { data: responsePayload, message: "User logged in successfully" };
  }

  async googleAuth(googleAuthPayload: GoogleAuthPayload) {
    const idToken = googleAuthPayload.idToken;

    if (!idToken) {
      throw new UnprocessableEntityException("Id token is required");
    }

    const request = await fetch(
      `https://www.googleapis.com/oauth2/v3/tokeninfo?id_token=${idToken}`,
    );

    if (request.status === 400) {
      throw new BadRequestException("Invalid token provided");
    }
    if (request.status === 500) {
      throw new InternalServerErrorException("Server error");
    }
    const verifyTokenResponse: TokenPayload = await request.json();

    const userEmail = verifyTokenResponse.email;
    let userExists = await this.userService.findUserByEmail(userEmail);

    if (userExists === null) {
      const userPayload = {
        email: userEmail,
        name: `${verifyTokenResponse.given_name || ""} ${verifyTokenResponse.family_name || ""}`,
        password: "",
      };

      const createUserPayload: CreateUserRecordOptions = {
        createPayload: userPayload,
        dbTransaction: {
          useTransaction: false,
        },
      };
      userExists = await this.userService.createUser(createUserPayload);
    }

    const accessToken = this.tokenService.signToken({
      sub: userExists.id,
      email: userExists.email,
      name: userExists.name,
    });

    return {
      message: "Login successful",
      data: {
        accessToken: accessToken,
        user: userExists,
      },
    };
  }

  async getCurrentUser(user: AuthUser) {
    const loggedInUser = await this.userService.findUserByEmail(user.email);
    if (!loggedInUser) {
      throw new BadRequestException("Invalid user");
    }

    return {
      message: "User fetched successfully",
      data: loggedInUser,
    };
  }

  async resetPassword(payload: { password: string; token: string }) {
    const { password, token } = payload;
    const otpRecord = await this.otpService.get({ queryOptions: { token } });
    if (otpRecord === null) {
      throw new BadRequestException("Invalid token provided");
    }
    const user = await this.userService.get({
      queryOptions: { id: otpRecord.userId },
    });
    if (user === null) {
      throw new BadRequestException("Invalid credentials");
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    await this.userService.update({
      identifierOptions: { id: otpRecord.userId },
      updatePayload: { password: hashedPassword },
      dbTransaction: {
        useTransaction: false,
      },
    });

    await this.otpService.delete({
      identifierOptions: { _id: otpRecord.id },
      dbTransaction: {
        useTransaction: false,
      },
    });
    return { message: "Password reset successfully" };
  }

  async sendForgotPasswordMail(email: string) {
    const user = await this.userService.findUserByEmail(email);
    if (user === null) {
      throw new BadRequestException("Invalid credentials");
    }

    const passwordResetToken = await this.otpService.generateOtp(
      user.id,
      "password-reset",
      3600000,
    );
    // send email to user
    console.log(passwordResetToken);

    return { message: "Password reset email sent" };
  }
}
