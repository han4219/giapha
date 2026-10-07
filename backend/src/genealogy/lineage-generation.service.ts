import { Injectable } from '@nestjs/common';
import {
  FamilyPersonMembershipType,
  GenderType,
  Prisma,
} from '@prisma/client';
import { ErrorCode } from '../common/errors/error-codes';
import { DomainException } from '../common/errors/domain.exception';
import { PrismaService } from '../prisma/prisma.service';
import { GenealogyQueryService } from './genealogy-query.service';

type ParentContext = {
  personId: string;
  gender: GenderType;
  membershipType: FamilyPersonMembershipType;
  generation: number | null;
};

@Injectable()
export class LineageGenerationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly genealogy: GenealogyQueryService,
  ) {}

  async recalculateForPerson(
    tx: Prisma.TransactionClient,
    personId: string,
    familyId: string,
  ): Promise<void> {
    const parentIds = await this.genealogy.findParents(personId);
    if (parentIds.length === 0) {
      return;
    }

    const parents = await tx.person.findMany({
      where: { id: { in: parentIds }, deletedAt: null },
      include: { familyPerson: true },
    });

    const contexts: ParentContext[] = parents
      .filter((p) => p.familyPerson?.familyId === familyId)
      .map((p) => ({
        personId: p.id,
        gender: p.gender,
        membershipType: p.familyPerson!.membershipType,
        generation: p.familyPerson!.generation,
      }));

    const lineageMaleParents = contexts.filter(
      (p) =>
        p.gender === GenderType.MALE &&
        p.membershipType === FamilyPersonMembershipType.LINEAGE &&
        p.generation !== null,
    );

    if (lineageMaleParents.length > 1) {
      const gens = new Set(lineageMaleParents.map((p) => p.generation));
      if (gens.size > 1) {
        throw new DomainException(
          ErrorCode.INVALID_LINEAGE_GENERATION,
          'Conflicting lineage generations from multiple male lineage parents',
        );
      }
    }

    let membershipType: FamilyPersonMembershipType;
    let generation: number | null;

    if (lineageMaleParents.length >= 1) {
      const fatherGen = lineageMaleParents[0].generation!;
      membershipType = FamilyPersonMembershipType.LINEAGE;
      generation = fatherGen + 1;
    } else {
      const hasLineageParent = contexts.some(
        (p) => p.membershipType === FamilyPersonMembershipType.LINEAGE,
      );
      if (hasLineageParent) {
        membershipType = FamilyPersonMembershipType.NON_LINEAGE;
        generation = null;
      } else {
        membershipType = FamilyPersonMembershipType.NON_LINEAGE;
        generation = null;
      }
    }

    const existing = await tx.familyPerson.findUnique({
      where: { personId },
    });

    if (existing && existing.familyId !== familyId) {
      throw new DomainException(
        ErrorCode.INVALID_LINEAGE_GENERATION,
        'Person already belongs to another family',
      );
    }

    if (existing) {
      if (
        existing.membershipType === FamilyPersonMembershipType.LINEAGE &&
        existing.generation !== null &&
        membershipType === FamilyPersonMembershipType.LINEAGE &&
        generation !== null &&
        existing.generation !== generation
      ) {
        throw new DomainException(
          ErrorCode.INVALID_LINEAGE_GENERATION,
          `Lineage generation conflict: existing G${existing.generation}, computed G${generation}`,
        );
      }
      await tx.familyPerson.update({
        where: { personId },
        data: { membershipType, generation },
      });
    } else {
      await tx.familyPerson.create({
        data: { familyId, personId, membershipType, generation },
      });
    }
  }

  async assignFounderMembership(
    tx: Prisma.TransactionClient,
    familyId: string,
    founderPersonId: string,
  ): Promise<void> {
    await tx.familyPerson.upsert({
      where: { personId: founderPersonId },
      create: {
        familyId,
        personId: founderPersonId,
        membershipType: FamilyPersonMembershipType.LINEAGE,
        generation: 1,
      },
      update: {
        membershipType: FamilyPersonMembershipType.LINEAGE,
        generation: 1,
      },
    });
  }
}
