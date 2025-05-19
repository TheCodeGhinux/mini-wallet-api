import { ApiProperty } from "@nestjs/swagger";

export class BadRequestErrorResponseDto {
  @ApiProperty({ example: false })
  success: boolean;

  @ApiProperty({ example: "Bad request error" })
  message: string;
}

export class NotFoundErrorResponseDto {
  @ApiProperty({ example: false })
  success: boolean;

  @ApiProperty({ example: "Not found error" })
  message: string;
}

export class InternalServerErrorResponseDto {
  @ApiProperty({ example: false })
  success: boolean;

  @ApiProperty({ example: "Internal server error" })
  message: string;
}

export class UnauthorizedErrorResponseDto {
  @ApiProperty({ example: false })
  success: boolean;

  @ApiProperty({ example: "Unauthorized error" })
  message: string;
}

export class MetaDto {
  @ApiProperty({ example: 7 })
  totalDocs: number;

  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({ example: 1 })
  totalPages: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 1 })
  pagingCounter: number;

  @ApiProperty({ example: false })
  hasPrevPage: boolean;

  @ApiProperty({ example: false })
  hasNextPage: boolean;

  @ApiProperty({ example: null })
  prevPage: number | null;

  @ApiProperty({ example: null })
  nextPage: number | null;
}
