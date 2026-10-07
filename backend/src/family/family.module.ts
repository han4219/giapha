import { Module } from '@nestjs/common';
import { GenealogyModule } from '../genealogy/genealogy.module';
import { PersonModule } from '../person/person.module';
import { FamilyController } from './family.controller';
import { FamilyService } from './family.service';

@Module({
  imports: [PersonModule, GenealogyModule],
  controllers: [FamilyController],
  providers: [FamilyService],
  exports: [FamilyService],
})
export class FamilyModule {}
