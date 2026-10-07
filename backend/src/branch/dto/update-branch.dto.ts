import { ApiPropertyOptional } from '@nestjs/swagger';
import { BranchStatus, BranchType } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateBranchDto {
  @ApiPropertyOptional({ enum: BranchType })
  @IsOptional()
  @IsEnum(BranchType)
  branchType?: BranchType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  branchName?: string;

  @ApiPropertyOptional({ enum: BranchStatus })
  @IsOptional()
  @IsEnum(BranchStatus)
  status?: BranchStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}
