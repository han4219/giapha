import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import {
  FamilyPersonMembershipType,
  GenderType,
} from '@prisma/client';
import { ErrorCode } from '../common/errors/error-codes';
import { DomainException } from '../common/errors/domain.exception';
import { PrismaService } from '../prisma/prisma.service';
import { PersonService } from '../person/person.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';

@Injectable()
export class BranchService {
  private readonly logger = new Logger(BranchService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly personService: PersonService,
  ) {}

  async listByFamily(familyId: string) {
    return this.prisma.branch.findMany({
      where: { familyId },
      orderBy: { branchCode: 'asc' },
    });
  }

  async findById(branchId: string) {
    const branch = await this.prisma.branch.findUnique({
      where: { id: branchId },
    });
    if (!branch) {
      throw new DomainException(
        ErrorCode.BRANCH_NOT_FOUND,
        `Branch ${branchId} not found`,
        HttpStatus.NOT_FOUND,
      );
    }
    return branch;
  }

  async create(familyId: string, dto: CreateBranchDto) {
    await this.personService.ensureActive(dto.rootPersonId);

    const fp = await this.prisma.familyPerson.findUnique({
      where: { personId: dto.rootPersonId },
    });

    if (!fp || fp.familyId !== familyId) {
      throw new DomainException(
        ErrorCode.INVALID_BRANCH_ROOT,
        'Root person must belong to this family',
      );
    }

    const person = await this.prisma.person.findUniqueOrThrow({
      where: { id: dto.rootPersonId },
    });

    if (person.gender !== GenderType.MALE) {
      throw new DomainException(
        ErrorCode.INVALID_BRANCH_ROOT,
        'Branch root must be male',
      );
    }
    if (fp.membershipType !== FamilyPersonMembershipType.LINEAGE) {
      throw new DomainException(
        ErrorCode.INVALID_BRANCH_ROOT,
        'Branch root must be LINEAGE',
      );
    }
    if (fp.generation !== 2) {
      throw new DomainException(
        ErrorCode.INVALID_BRANCH_GENERATION,
        'Branch root must be generation 2',
      );
    }

    this.logger.log(`Creating branch ${dto.branchCode} for family ${familyId}`);

    return this.prisma.branch.create({
      data: {
        familyId,
        rootPersonId: dto.rootPersonId,
        branchType: dto.branchType,
        branchCode: dto.branchCode,
        branchName: dto.branchName,
        generation: 2,
        description: dto.description,
      },
    });
  }

  async update(branchId: string, dto: UpdateBranchDto) {
    await this.findById(branchId);
    return this.prisma.branch.update({
      where: { id: branchId },
      data: dto,
    });
  }
}
