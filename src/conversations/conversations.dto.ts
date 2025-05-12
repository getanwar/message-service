import {
  Min,
  Max,
  IsInt,
  IsEnum,
  IsString,
  IsMongoId,
  MinLength,
  IsOptional,
  IsNotEmpty,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class GetMessagesByConversationQueryDto {
  @Min(1)
  @IsInt()
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  page: number;

  @Min(1)
  @IsInt()
  @Max(100)
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  perPage: number;

  @IsOptional()
  @IsEnum({ ASC: 'ASC', DESC: 'DESC' })
  sort: 'ASC' | 'DESC';
}
export class GetMessagesByConversationParamsDto {
  @IsMongoId()
  @IsNotEmpty()
  conversationId: string;
}

export class SearchInConversationMessagesParamsDto {
  @IsMongoId()
  @IsNotEmpty()
  conversationId: string;
}

export class SearchInConversationMessagesQueryDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  q: string;

  @Min(1)
  @IsInt()
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  page: number;

  @Min(1)
  @IsInt()
  @Max(100)
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  perPage: number;
}
