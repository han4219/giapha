import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { BranchService } from './branch.service';

@ApiTags('branches')
@Controller()
export class BranchController {
  constructor(private readonly branchService: BranchService) {}

  @Get('api/families/:familyId/branches')
  list(@Param('familyId', ParseUUIDPipe) familyId: string) {
    return this.branchService.listByFamily(familyId);
  }

  @Post('api/families/:familyId/branches')
  create(
    @Param('familyId', ParseUUIDPipe) familyId: string,
    @Body() dto: CreateBranchDto,
  ) {
    return this.branchService.create(familyId, dto);
  }

  @Get('api/branches/:branchId')
  get(@Param('branchId', ParseUUIDPipe) branchId: string) {
    return this.branchService.findById(branchId);
  }

  @Patch('api/branches/:branchId')
  update(
    @Param('branchId', ParseUUIDPipe) branchId: string,
    @Body() dto: UpdateBranchDto,
  ) {
    return this.branchService.update(branchId, dto);
  }
}
