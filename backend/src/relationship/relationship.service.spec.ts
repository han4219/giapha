import { GenderType, RelationshipType } from '@prisma/client';
import { ErrorCode } from '../common/errors/error-codes';
import { DomainException } from '../common/errors/domain.exception';
import { GenealogyQueryService } from '../genealogy/genealogy-query.service';
import { LineageGenerationService } from '../genealogy/lineage-generation.service';
import { PersonService } from '../person/person.service';
import { PrismaService } from '../prisma/prisma.service';
import { RelationshipService } from './relationship.service';

describe('RelationshipService', () => {
  const prisma = {
    $transaction: jest.fn((fn: (tx: unknown) => unknown) => fn(prisma)),
    relationship: { create: jest.fn() },
    person: { findUniqueOrThrow: jest.fn(), findUnique: jest.fn() },
    familyPerson: { findUnique: jest.fn() },
  } as unknown as PrismaService;

  const personService = {
    ensureActive: jest.fn(),
  } as unknown as PersonService;

  const genealogy = {
    isDescendantOf: jest.fn(),
    findParents: jest.fn(),
  } as unknown as GenealogyQueryService;

  const lineageGeneration = {
    recalculateForPerson: jest.fn(),
  } as unknown as LineageGenerationService;

  let service: RelationshipService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new RelationshipService(
      prisma,
      personService,
      genealogy,
      lineageGeneration,
    );
  });

  it('rejects self relationship', async () => {
    const id = '10000000-0000-4000-8000-000000000099';
    await expect(
      service.create({
        sourcePersonId: id,
        targetPersonId: id,
        relationshipType: RelationshipType.PARENT_CHILD,
      }),
    ).rejects.toMatchObject({ code: ErrorCode.SELF_RELATIONSHIP });
  });

  it('canonicalizes spouse pair on insert', async () => {
    const a = '10000000-0000-4000-8000-000000000001';
    const b = '10000000-0000-4000-8000-000000000002';
    (prisma.relationship.create as jest.Mock).mockResolvedValue({ id: 'rel' });

    await service.create({
      sourcePersonId: b,
      targetPersonId: a,
      relationshipType: RelationshipType.SPOUSE,
    });

    expect(prisma.relationship.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          sourcePersonId: a,
          targetPersonId: b,
        }),
      }),
    );
  });
});

describe('RelationshipService parent limits', () => {
  it('validates max biological father', async () => {
    const prisma = {
      $transaction: jest.fn(),
      relationship: {
        create: jest.fn(),
        findMany: jest.fn().mockResolvedValue([
          {
            sourcePersonId: 'father-1',
            sourcePerson: { gender: GenderType.MALE },
          },
        ]),
      },
      person: {
        findUniqueOrThrow: jest.fn().mockResolvedValue({
          id: 'father-2',
          gender: GenderType.MALE,
        }),
      },
      familyPerson: { findUnique: jest.fn() },
    } as unknown as PrismaService;

    const service = new RelationshipService(
      prisma,
      { ensureActive: jest.fn() } as unknown as PersonService,
      { isDescendantOf: jest.fn().mockResolvedValue(false) } as unknown as GenealogyQueryService,
      { recalculateForPerson: jest.fn() } as unknown as LineageGenerationService,
    );

    await expect(
      service.create({
        sourcePersonId: 'father-2',
        targetPersonId: 'child',
        relationshipType: RelationshipType.PARENT_CHILD,
      }),
    ).rejects.toMatchObject({
      code: ErrorCode.MAX_BIOLOGICAL_FATHER_EXCEEDED,
    });
  });
});
