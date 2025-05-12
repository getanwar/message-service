import { Types } from 'mongoose';
import { Exclude, Expose, Transform } from 'class-transformer';
import { IsString, IsNotEmpty, IsMongoId, IsDateString } from 'class-validator';

export class CreateMessageInputDto {
  @IsString()
  @IsNotEmpty()
  content: string;

  @IsMongoId()
  senderId: string;

  @IsMongoId()
  conversationId: string;
}

export class MongoMessageOutputDto {
  @Expose()
  @Transform(({ obj }) => obj._id.toString())
  id: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsMongoId()
  @Transform(({ value }: { value: Types.ObjectId }) => value.toString())
  senderId: string;

  @IsMongoId()
  @Transform(({ value }: { value: Types.ObjectId }) => value.toString())
  conversationId: string;

  @Transform(({ value }) => value.toISOString())
  timestamp: Date;

  @Exclude()
  _id: Types.ObjectId;

  @Exclude()
  __v: number;

  @Transform(({ value }: { value: Types.ObjectId }) => value.toString())
  websiteId: string;
}

export class MessageCreatedEventDto {
  @IsMongoId()
  id: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsDateString()
  timestamp: Date;

  @IsMongoId()
  websiteId: string;

  @IsMongoId()
  conversationId: string;
}
