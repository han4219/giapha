import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateRelationshipDto } from './dto/create-relationship.dto';
import { RelationshipService } from './relationship.service';

@ApiTags('relationships')
@Controller('api/relationships')
export class RelationshipController {
  constructor(private readonly relationshipService: RelationshipService) {}

  @Post()
  @ApiOperation({ summary: 'Create relationship' })
  create(@Body() dto: CreateRelationshipDto) {
    return this.relationshipService.create(dto);
  }
}
