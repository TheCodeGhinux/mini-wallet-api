import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { JwtPayload } from "jsonwebtoken";

export const CurrentUser = createParamDecorator(
  (data: unknown, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest();

    return request.user as JwtPayload;
  },
);
