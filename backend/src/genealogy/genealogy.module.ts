import { Module } from '@nestjs/common';
import { GenealogyQueryService } from './genealogy-query.service';
import { LineageGenerationService } from './lineage-generation.service';

@Module({
  providers: [GenealogyQueryService, LineageGenerationService],
  exports: [GenealogyQueryService, LineageGenerationService],
})
export class GenealogyModule {}
