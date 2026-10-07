import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BranchType } from '@prisma/client';
import { IsEnum, IsInt, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateBranchDto {
  @ApiProperty()
  @IsUUID()
  rootPersonId!: string;

  @ApiProperty({ enum: BranchType })
  @IsEnum(BranchType)
  branchType!: BranchType;

  @ApiProperty()
  @IsString()
  @MaxLength(50)
  branchCode!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(255)
  branchName!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}
