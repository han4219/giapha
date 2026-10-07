import { Module } from '@nestjs/common';
import { GenealogyModule } from '../genealogy/genealogy.module';
import { PersonContextService } from './person-context.service';
import { PersonController } from './person.controller';
import { PersonService } from './person.service';

@Module({
  imports: [GenealogyModule],
  controllers: [PersonController],
  providers: [PersonService, PersonContextService],
  exports: [PersonService],
})
export class PersonModule {}
