import {
  BadRequestException,
  CallHandler,
  ExecutionContext,
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NestInterceptor,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Observable, throwError } from "rxjs";
import { catchError, map } from "rxjs/operators";
import { Request, Response } from "express";
import { IS_PRIVATE_KEY } from "@decorators/private.decorator";
import { PaginationMetaType } from "@/types/pagination.meta";

interface ResponseData {
  message?: string;
  data?: Record<string, unknown>;
  [key: string]: unknown;
  meta?: PaginationMetaType;
}

const DEFAULT_PRIVATE_FIELDS = ["password"];

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  private readonly logger = new Logger(ResponseInterceptor.name);

  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      map((res: unknown) => this.responseHandler(res, context)),
      catchError((err: unknown) =>
        throwError(() => this.errorHandler(err, context)),
      ),
    );
  }

  errorHandler(exception: unknown, context: ExecutionContext): HttpException {
    const req = context.switchToHttp().getRequest<Request>();

    // Handle BadRequestException (which includes class-validator DTO errors)
    if (exception instanceof BadRequestException) {
      const response = exception.getResponse();

      if (typeof response === "object" && "message" in response) {
        const message = response["message"];

        // Handle class-validator errors array
        if (Array.isArray(message)) {
          const formattedErrors = {};

          // Process class-validator errors
          message.forEach((error) => {
            // Handle string errors
            if (typeof error === "string") {
              const match = error.match(/^(\w+)\s+(.*)/);
              if (match) {
                const field = match[1];
                const errorMsg = match[2];
                formattedErrors[field] = errorMsg;
              } else {
                // If it doesn't match our pattern, store as a general error
                formattedErrors["general"] = formattedErrors["general"] || [];
                formattedErrors["general"].push(error);
              }
            }
            // Handle object errors (usually from class-validator)
            else if (typeof error === "object" && error !== null) {
              // Check for property and constraints format from class-validator
              if ("property" in error && "constraints" in error) {
                const field = error["property"];
                const constraints = error["constraints"];

                // Get the first error message from constraints
                formattedErrors[field] = Object.values(constraints)[0];
              }
            }
          });

          return new BadRequestException({
            success: false,
            message: "Validation failed",
            errors:
              Object.keys(formattedErrors).length > 0
                ? formattedErrors
                : message,
          });
        }

        // Handle string messages or other formats
        return new BadRequestException({
          success: false,
          message: "Validation failed",
          errors: message,
        });
      }
    }

    // Check for Mongoose validation errors
    if (exception instanceof Error && exception.name === "ValidationError") {
      const errorMessage = exception.message;

      const errors = {};
      const fieldErrors = errorMessage
        .split(",")
        .filter((err) => err.includes(":"));

      for (const fieldError of fieldErrors) {
        const matches = fieldError.match(/([^:]+): Path `([^`]+)` (.*)/);
        if (matches && matches.length >= 3) {
          const field = matches[2];
          const message = matches[3];
          errors[field] = message;
        }
      }

      return new BadRequestException({
        success: false,
        message: "Validation failed",
        errors: Object.keys(errors).length > 0 ? errors : errorMessage,
      });
    }

    // Pass through other HTTP exceptions
    if (exception instanceof HttpException) return exception;

    // Log and handle unknown errors
    const errorMessage =
      exception instanceof Error ? exception.message : "Unknown error";
    const errorStack = exception instanceof Error ? exception.stack : undefined;

    this.logger.error(
      `Error processing request for ${req.method} ${req.url}, Message: ${errorMessage}, Stack: ${errorStack}`,
    );

    return new InternalServerErrorException({
      success: false,
      message: "Internal server error",
    });
  }

  responseHandler(res: unknown, context: ExecutionContext): unknown {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse<Response>();
    const success =
      response.statusCode === 200 || response.statusCode === 201 ? true : false;

    response.setHeader("Content-Type", "application/json");

    if (typeof res === "object" && res !== null) {
      const { message, data, meta } = res as ResponseData;
      const processedData = data
        ? this.removePrivateFields(JSON.parse(JSON.stringify(data)), context)
        : undefined;
      return {
        success,
        message,
        data: processedData,
        meta,
      };
    } else {
      return res;
    }
  }

  private removePrivateFields(
    data: unknown,
    context: ExecutionContext,
  ): unknown {
    if (Array.isArray(data)) {
      return data.map((item) => this.removePrivateFields(item, context));
    }

    if (typeof data !== "object" || data === null) {
      return data;
    }

    const result = { ...data };

    const decoratorPrivateFields =
      this.reflector.get<string[]>(IS_PRIVATE_KEY, context.getHandler()) || [];

    const privateFields = [
      ...DEFAULT_PRIVATE_FIELDS,
      ...decoratorPrivateFields,
    ];

    for (const field of privateFields) {
      delete result[field];
    }

    for (const key in result) {
      if (
        typeof result[key] === "object" &&
        result[key] instanceof Date === false &&
        result[key] !== null
      ) {
        result[key] = this.removePrivateFields(result[key], context);
      }
    }

    return result;
  }
}
