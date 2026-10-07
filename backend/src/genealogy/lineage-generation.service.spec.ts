import {
  FamilyPersonMembershipType,
  GenderType,
} from '@prisma/client';
import { GenealogyQueryService } from './genealogy-query.service';
import { LineageGenerationService } from './lineage-generation.service';
import { PrismaService } from '../prisma/prisma.service';

describe('LineageGenerationService', () => {
  it('assigns LINEAGE from male lineage parent', async () => {
    const tx = {
      person: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'father',
            gender: GenderType.MALE,
            familyPerson: {
              familyId: 'fam',
              membershipType: FamilyPersonMembershipType.LINEAGE,
              generation: 2,
            },
          },
        ]),
      },
      familyPerson: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    const genealogy = {
      findParents: jest.fn().mockResolvedValue(['father']),
    } as unknown as GenealogyQueryService;

    const service = new LineageGenerationService(
      {} as PrismaService,
      genealogy,
    );

    await service.recalculateForPerson(
      tx as never,
      'child',
      'fam',
    );

    expect(tx.familyPerson.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          membershipType: FamilyPersonMembershipType.LINEAGE,
          generation: 3,
        }),
      }),
    );
  });

  it('assigns NON_LINEAGE for child of lineage female only', async () => {
    const tx = {
      person: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'mother',
            gender: GenderType.FEMALE,
            familyPerson: {
              familyId: 'fam',
              membershipType: FamilyPersonMembershipType.LINEAGE,
              generation: 3,
            },
          },
        ]),
      },
      familyPerson: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn(),
      },
    };

    const genealogy = {
      findParents: jest.fn().mockResolvedValue(['mother']),
    } as unknown as GenealogyQueryService;

    const service = new LineageGenerationService(
      {} as PrismaService,
      genealogy,
    );

    await service.recalculateForPerson(tx as never, 'child', 'fam');

    expect(tx.familyPerson.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          membershipType: FamilyPersonMembershipType.NON_LINEAGE,
          generation: null,
        }),
      }),
    );
  });
});
