import { ROLE_ENUM } from "@modules/user/user.schema";
import { UserService } from "@modules/user/user.service";
import {
  CanActivate,
  ExecutionContext,
  HttpStatus,
  Injectable,
} from "@nestjs/common";
import { CustomHttpException } from "@shared/exception.handler";
import * as SYS_MSG from "@shared/system.messages";

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private userService: UserService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const { user } = request;
    const userId: string = user?.sub;

    if (!userId) {
      throw new CustomHttpException(
        SYS_MSG.UNAUTHORIZED_ACTION,
        HttpStatus.UNAUTHORIZED,
      );
    }
    const userRecord = await this.userService.get({
      queryOptions: { _id: userId },
    });
    if (userRecord === null) {
      throw new CustomHttpException(
        SYS_MSG.UNAUTHORIZED_ACTION,
        HttpStatus.UNAUTHORIZED,
      );
    }

    if (userRecord.role !== ROLE_ENUM.ADMIN) {
      throw new CustomHttpException(
        SYS_MSG.UNAUTHORIZED_ACTION,
        HttpStatus.UNAUTHORIZED,
      );
    }

    return true;
  }
}
