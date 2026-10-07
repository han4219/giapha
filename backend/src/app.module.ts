import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { BranchModule } from './branch/branch.module';
import { EventModule } from './event/event.module';
import { FamilyModule } from './family/family.module';
import { GraveModule } from './grave/grave.module';
import { MediaModule } from './media/media.module';
import { PersonModule } from './person/person.module';
import { PrismaModule } from './prisma/prisma.module';
import { RelationshipModule } from './relationship/relationship.module';

@Module({
  imports: [
    PrismaModule,
    PersonModule,
    FamilyModule,
    RelationshipModule,
    BranchModule,
    GraveModule,
    EventModule,
    MediaModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
