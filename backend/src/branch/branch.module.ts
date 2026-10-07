import { Module } from '@nestjs/common';
import { PersonModule } from '../person/person.module';
import { BranchController } from './branch.controller';
import { BranchService } from './branch.service';

@Module({
  imports: [PersonModule],
  controllers: [BranchController],
  providers: [BranchService],
})
export class BranchModule {}
