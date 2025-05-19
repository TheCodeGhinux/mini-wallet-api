import { Injectable, HttpStatus } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { Request } from "express";
import { TokenExpiredError } from "jsonwebtoken";
import { CustomHttpException } from "@shared/exception.handler";
import * as SYS_MSG from "@shared/system.messages";

export interface JwtPayload {
  sub: string;
  email: string;
  exp?: number;
  name?: string;
}

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(" ") ?? [];
    return type === "Bearer" ? token : undefined;
  }

  verify(token: string) {
    try {
      const secret = this.configService.get<string>("jwt.secret");
      if (!secret) {
        throw new CustomHttpException(
          SYS_MSG.INTERNAL_SERVER_ERROR,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
      const payload = this.jwtService.verify<JwtPayload>(token, {
        secret,
      });
      return payload;
    } catch (error) {
      console.log("error occured", error);
      if (error instanceof TokenExpiredError) {
        throw new CustomHttpException(
          SYS_MSG.AUTH_TOKEN_EXPIRED,
          HttpStatus.UNAUTHORIZED,
        );
      }
      throw new CustomHttpException(
        SYS_MSG.AUTH_TOKEN_INVALID,
        HttpStatus.UNAUTHORIZED,
      );
    }
  }
  verifyToken(token: string, request: Request): { request: Request } {
    try {
      const secret = this.configService.get<string>("jwt.secret");
      if (!secret) {
        throw new CustomHttpException(
          SYS_MSG.INTERNAL_SERVER_ERROR,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
      const payload = this.jwtService.verify<JwtPayload>(token, { secret });

      (request as any).user = payload;
      return {
        request,
      };
    } catch (err: unknown) {
      console.log("error occured", err);
      if (err instanceof TokenExpiredError) {
        throw new CustomHttpException(
          SYS_MSG.AUTH_TOKEN_EXPIRED,
          HttpStatus.UNAUTHORIZED,
        );
      }
      throw new CustomHttpException(
        SYS_MSG.AUTH_TOKEN_INVALID,
        HttpStatus.UNAUTHORIZED,
      );
    }
  }

  signToken(payload: Partial<JwtPayload>): string {
    const secret = this.configService.get<string>("jwt.secret");
    if (!secret) {
      throw new CustomHttpException(
        SYS_MSG.INTERNAL_SERVER_ERROR,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    return this.jwtService.sign(payload, { secret });
  }
}
