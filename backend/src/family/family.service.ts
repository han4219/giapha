import { HttpStatus, Injectable } from '@nestjs/common';
import { ErrorCode } from '../common/errors/error-codes';
import { DomainException } from '../common/errors/domain.exception';
import { LineageGenerationService } from '../genealogy/lineage-generation.service';
import { PrismaService } from '../prisma/prisma.service';
import { PersonService } from '../person/person.service';
import { CreateFamilyDto } from './dto/create-family.dto';
import { UpdateFamilyDto } from './dto/update-family.dto';

@Injectable()
export class FamilyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly personService: PersonService,
    private readonly lineageGeneration: LineageGenerationService,
  ) {}

  async findAll() {
    return this.prisma.family.findMany({ orderBy: { name: 'asc' } });
  }

  async findById(id: string) {
    const family = await this.prisma.family.findUnique({ where: { id } });
    if (!family) {
      throw new DomainException(
        ErrorCode.FAMILY_NOT_FOUND,
        `Family ${id} not found`,
        HttpStatus.NOT_FOUND,
      );
    }
    return family;
  }

  async create(dto: CreateFamilyDto) {
    return this.prisma.$transaction(async (tx) => {
      const family = await tx.family.create({
        data: {
          name: dto.name,
          description: dto.description,
          founderPersonId: dto.founderPersonId,
        },
      });
      if (dto.founderPersonId) {
        await this.personService.ensureActive(dto.founderPersonId);
        await this.lineageGeneration.assignFounderMembership(
          tx,
          family.id,
          dto.founderPersonId,
        );
      }
      return family;
    });
  }

  async update(id: string, dto: UpdateFamilyDto) {
    await this.findById(id);
    return this.prisma.$transaction(async (tx) => {
      const family = await tx.family.update({
        where: { id },
        data: {
          name: dto.name,
          description: dto.description,
          founderPersonId: dto.founderPersonId,
        },
      });
      if (dto.founderPersonId) {
        await this.personService.ensureActive(dto.founderPersonId);
        await this.lineageGeneration.assignFounderMembership(
          tx,
          family.id,
          dto.founderPersonId,
        );
      }
      return family;
    });
  }
}
