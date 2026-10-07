import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MediaOwnerType, MediaType } from '@prisma/client';
import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreateMediaDto {
  @ApiProperty({ enum: MediaOwnerType })
  @IsEnum(MediaOwnerType)
  ownerType!: MediaOwnerType;

  @ApiProperty()
  @IsUUID()
  ownerId!: string;

  @ApiProperty({ enum: MediaType })
  @IsEnum(MediaType)
  mediaType!: MediaType;

  @ApiProperty()
  @IsString()
  fileUrl!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fileName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  thumbnailUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
