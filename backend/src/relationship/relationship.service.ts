import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { GenderType, RelationshipType } from '@prisma/client';
import { ErrorCode } from '../common/errors/error-codes';
import { DomainException } from '../common/errors/domain.exception';
import { GenealogyQueryService } from '../genealogy/genealogy-query.service';
import { LineageGenerationService } from '../genealogy/lineage-generation.service';
import { PrismaService } from '../prisma/prisma.service';
import { PersonService } from '../person/person.service';
import { CreateRelationshipDto } from './dto/create-relationship.dto';

@Injectable()
export class RelationshipService {
  private readonly logger = new Logger(RelationshipService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly personService: PersonService,
    private readonly genealogy: GenealogyQueryService,
    private readonly lineageGeneration: LineageGenerationService,
  ) {}

  async create(dto: CreateRelationshipDto) {
    if (dto.sourcePersonId === dto.targetPersonId) {
      throw new DomainException(
        ErrorCode.SELF_RELATIONSHIP,
        'Cannot relate person to themselves',
      );
    }

    await this.personService.ensureActive(dto.sourcePersonId);
    await this.personService.ensureActive(dto.targetPersonId);

    if (dto.endDate && dto.startDate && dto.endDate < dto.startDate) {
      throw new DomainException(
        ErrorCode.INVALID_PARENT_RELATIONSHIP,
        'endDate must be >= startDate',
      );
    }

    let sourceId = dto.sourcePersonId;
    let targetId = dto.targetPersonId;

    if (dto.relationshipType === RelationshipType.SPOUSE) {
      [sourceId, targetId] = this.canonicalSpousePair(
        dto.sourcePersonId,
        dto.targetPersonId,
      );
    }

    if (dto.relationshipType === RelationshipType.PARENT_CHILD) {
      await this.validateParentChild(sourceId, targetId);
    }

    return this.prisma.$transaction(async (tx) => {
      try {
        const rel = await tx.relationship.create({
          data: {
            sourcePersonId: sourceId,
            targetPersonId: targetId,
            relationshipType: dto.relationshipType,
            startDate: dto.startDate ? new Date(dto.startDate) : undefined,
            endDate: dto.endDate ? new Date(dto.endDate) : undefined,
            note: dto.note,
          },
        });

        if (dto.relationshipType === RelationshipType.PARENT_CHILD) {
          const familyId = await this.resolveFamilyIdForParent(sourceId);
          if (familyId) {
            await this.lineageGeneration.recalculateForPerson(
              tx,
              targetId,
              familyId,
            );
          }
        }

        this.logger.log(
          `Created relationship ${dto.relationshipType} ${sourceId} -> ${targetId}`,
        );
        return rel;
      } catch (e: unknown) {
        if (
          e &&
          typeof e === 'object' &&
          'code' in e &&
          (e as { code: string }).code === 'P2002'
        ) {
          throw new DomainException(
            dto.relationshipType === RelationshipType.SPOUSE
              ? ErrorCode.DUPLICATE_SPOUSE_RELATIONSHIP
              : ErrorCode.DUPLICATE_RELATIONSHIP,
            'Relationship already exists',
          );
        }
        throw e;
      }
    });
  }

  private canonicalSpousePair(a: string, b: string): [string, string] {
    return a < b ? [a, b] : [b, a];
  }

  private async validateParentChild(parentId: string, childId: string) {
    const cycle = await this.genealogy.isDescendantOf(childId, parentId);
    if (cycle) {
      throw new DomainException(
        ErrorCode.RELATIONSHIP_CYCLE_DETECTED,
        'Parent-child would create a cycle',
      );
    }

    const parent = await this.prisma.person.findUniqueOrThrow({
      where: { id: parentId },
    });

    const existingParents = await this.prisma.relationship.findMany({
      where: {
        targetPersonId: childId,
        relationshipType: RelationshipType.PARENT_CHILD,
      },
      include: { sourcePerson: true },
    });

    const sameGenderParents = existingParents.filter(
      (r) => r.sourcePerson.gender === parent.gender,
    );

    if (
      parent.gender === GenderType.MALE &&
      sameGenderParents.length >= 1
    ) {
      throw new DomainException(
        ErrorCode.MAX_BIOLOGICAL_FATHER_EXCEEDED,
        'Child already has a biological father',
      );
    }
    if (
      parent.gender === GenderType.FEMALE &&
      sameGenderParents.length >= 1
    ) {
      throw new DomainException(
        ErrorCode.MAX_BIOLOGICAL_MOTHER_EXCEEDED,
        'Child already has a biological mother',
      );
    }
    if (
      parent.gender === GenderType.UNKNOWN &&
      sameGenderParents.some((r) => r.sourcePersonId === parentId)
    ) {
      throw new DomainException(
        ErrorCode.INVALID_PARENT_RELATIONSHIP,
        'Duplicate parent link',
      );
    }
  }

  private async resolveFamilyIdForParent(
    parentPersonId: string,
  ): Promise<string | null> {
    const fp = await this.prisma.familyPerson.findUnique({
      where: { personId: parentPersonId },
    });
    return fp?.familyId ?? null;
  }
}
