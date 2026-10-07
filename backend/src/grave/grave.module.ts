import { Module } from '@nestjs/common';
import { GraveController } from './grave.controller';
import { GraveService } from './grave.service';

@Module({
  controllers: [GraveController],
  providers: [GraveService],
})
export class GraveModule {}
