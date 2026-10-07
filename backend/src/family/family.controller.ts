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
import { CreateFamilyDto } from './dto/create-family.dto';
import { UpdateFamilyDto } from './dto/update-family.dto';
import { FamilyService } from './family.service';

@ApiTags('families')
@Controller('api/families')
export class FamilyController {
  constructor(private readonly familyService: FamilyService) {}

  @Get()
  list() {
    return this.familyService.findAll();
  }

  @Get(':familyId')
  get(@Param('familyId', ParseUUIDPipe) familyId: string) {
    return this.familyService.findById(familyId);
  }

  @Post()
  create(@Body() dto: CreateFamilyDto) {
    return this.familyService.create(dto);
  }

  @Patch(':familyId')
  update(
    @Param('familyId', ParseUUIDPipe) familyId: string,
    @Body() dto: UpdateFamilyDto,
  ) {
    return this.familyService.update(familyId, dto);
  }
}
