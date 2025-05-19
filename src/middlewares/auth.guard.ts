import {
  CanActivate,
  ExecutionContext,
  Injectable,
  HttpStatus,
} from "@nestjs/common";

import { Request } from "express";
import { Reflector } from "@nestjs/core";
import { IS_PUBLIC_KEY } from "@decorators/skip-auth.decorator";
import * as SYS_MSG from "@shared/system.messages";
import { CustomHttpException } from "@shared/exception.handler";
import { TokenService } from "@helpers/jwt.token.service";

export interface JwtPayload {
  sub: string;
  email: string;
  exp: number;
}

export interface AuthUser {
  sub: string;
  email: string;
  walletId?: string;
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,

    private tokenService: TokenService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }
    let request = context.switchToHttp().getRequest<Request>();
    const token = this.tokenService.extractTokenFromHeader(request);
    // console.log("token => ", token)
    if (!token) {
      throw new CustomHttpException(
        SYS_MSG.AUTH_TOKEN_INVALID,
        HttpStatus.UNAUTHORIZED,
      );
    }

    const { request: updatedRequest } = this.tokenService.verifyToken(
      token,
      request,
    );
    request = updatedRequest;

    return true;
  }
}
