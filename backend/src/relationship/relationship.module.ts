import { Module } from '@nestjs/common';
import { GenealogyModule } from '../genealogy/genealogy.module';
import { PersonModule } from '../person/person.module';
import { RelationshipController } from './relationship.controller';
import { RelationshipService } from './relationship.service';

@Module({
  imports: [PersonModule, GenealogyModule],
  controllers: [RelationshipController],
  providers: [RelationshipService],
  exports: [RelationshipService],
})
export class RelationshipModule {}
