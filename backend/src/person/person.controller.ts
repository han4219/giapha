import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { GenealogyQueryService } from '../genealogy/genealogy-query.service';
import { PersonContextService } from './person-context.service';
import { CreatePersonDto } from './dto/create-person.dto';
import { UpdatePersonDto } from './dto/update-person.dto';
import { PersonService } from './person.service';

@ApiTags('persons')
@Controller('api/persons')
export class PersonController {
  constructor(
    private readonly personService: PersonService,
    private readonly genealogy: GenealogyQueryService,
    private readonly personContext: PersonContextService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create person' })
  create(@Body() dto: CreatePersonDto) {
    return this.personService.create(dto);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search persons by name' })
  search(@Query('q') q: string) {
    return this.personService.search(q ?? '');
  }

  @Get(':personId')
  @ApiOperation({ summary: 'Get person by id' })
  findOne(@Param('personId', ParseUUIDPipe) personId: string) {
    return this.personService.findById(personId);
  }

  @Patch(':personId')
  update(
    @Param('personId', ParseUUIDPipe) personId: string,
    @Body() dto: UpdatePersonDto,
  ) {
    return this.personService.update(personId, dto);
  }

  @Delete(':personId')
  softDelete(@Param('personId', ParseUUIDPipe) personId: string) {
    return this.personService.softDelete(personId);
  }

  @Get(':personId/parents')
  parents(@Param('personId', ParseUUIDPipe) personId: string) {
    return this.personContext.loadRelatedPersons(
      this.genealogy.findParents(personId),
    );
  }

  @Get(':personId/children')
  children(@Param('personId', ParseUUIDPipe) personId: string) {
    return this.personContext.loadRelatedPersons(
      this.genealogy.findChildren(personId),
    );
  }

  @Get(':personId/spouses')
  spouses(@Param('personId', ParseUUIDPipe) personId: string) {
    return this.personContext.loadRelatedPersons(
      this.genealogy.findSpouses(personId),
    );
  }

  @Get(':personId/siblings')
  siblings(@Param('personId', ParseUUIDPipe) personId: string) {
    return this.personContext.findSiblings(personId);
  }

  @Get(':personId/ancestors')
  ancestors(
    @Param('personId', ParseUUIDPipe) personId: string,
    @Query('maxDepth') maxDepth?: string,
  ) {
    return this.personContext.loadGraphNodes(
      this.genealogy.findAncestors(
        personId,
        maxDepth ? parseInt(maxDepth, 10) : undefined,
      ),
    );
  }

  @Get(':personId/descendants')
  descendants(
    @Param('personId', ParseUUIDPipe) personId: string,
    @Query('maxDepth') maxDepth?: string,
  ) {
    return this.personContext.loadGraphNodes(
      this.genealogy.findDescendants(
        personId,
        maxDepth ? parseInt(maxDepth, 10) : undefined,
      ),
    );
  }

  @Get(':personId/family-context')
  familyContext(
    @Param('personId', ParseUUIDPipe) personId: string,
    @Query('ancestorDepth') ancestorDepth?: string,
    @Query('descendantDepth') descendantDepth?: string,
    @Query('includeNonLineage') includeNonLineage?: string,
  ) {
    return this.personContext.buildFamilyContext(personId, {
      ancestorDepth: ancestorDepth ? parseInt(ancestorDepth, 10) : 2,
      descendantDepth: descendantDepth ? parseInt(descendantDepth, 10) : 3,
      includeNonLineage: includeNonLineage !== 'false',
    });
  }
}
