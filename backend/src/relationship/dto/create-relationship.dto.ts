import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RelationshipType } from '@prisma/client';
import { IsDateString, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateRelationshipDto {
  @ApiProperty()
  @IsUUID()
  sourcePersonId!: string;

  @ApiProperty()
  @IsUUID()
  targetPersonId!: string;

  @ApiProperty({ enum: RelationshipType })
  @IsEnum(RelationshipType)
  relationshipType!: RelationshipType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}
