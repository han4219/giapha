import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { GraveService } from './grave.service';

@ApiTags('graves')
@Controller('api/graves')
export class GraveController {
  constructor(private readonly graveService: GraveService) {}

  @Get()
  list() {
    return this.graveService.findAll();
  }

  @Get(':graveId')
  get(@Param('graveId', ParseUUIDPipe) graveId: string) {
    return this.graveService.findById(graveId);
  }
}
