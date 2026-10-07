import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ErrorCode } from '../common/errors/error-codes';
import { DomainException } from '../common/errors/domain.exception';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePersonDto } from './dto/create-person.dto';
import { UpdatePersonDto } from './dto/update-person.dto';
import { toPersonResponse } from './person.mapper';

@Injectable()
export class PersonService {
  private readonly logger = new Logger(PersonService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePersonDto) {
    this.validateDates(dto.birthDate, dto.deathDate);
    const person = await this.prisma.person.create({
      data: {
        fullName: dto.fullName,
        gender: dto.gender,
        birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
        deathDate: dto.deathDate ? new Date(dto.deathDate) : undefined,
        birthPlace: dto.birthPlace,
        hometown: dto.hometown,
        occupation: dto.occupation,
        biography: dto.biography,
        note: dto.note,
      },
      include: { familyPerson: true },
    });
    return toPersonResponse(person);
  }

  async findById(id: string) {
    const person = await this.prisma.person.findFirst({
      where: { id, deletedAt: null },
      include: { familyPerson: true },
    });
    if (!person) {
      throw new DomainException(
        ErrorCode.PERSON_NOT_FOUND,
        `Person ${id} not found`,
        HttpStatus.NOT_FOUND,
      );
    }
    return toPersonResponse(person);
  }

  async update(id: string, dto: UpdatePersonDto) {
    await this.ensureActive(id);
    this.validateDates(dto.birthDate, dto.deathDate);
    const person = await this.prisma.person.update({
      where: { id },
      data: {
        fullName: dto.fullName,
        gender: dto.gender,
        birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
        deathDate: dto.deathDate ? new Date(dto.deathDate) : undefined,
        birthPlace: dto.birthPlace,
        hometown: dto.hometown,
        occupation: dto.occupation,
        biography: dto.biography,
        note: dto.note,
      },
      include: { familyPerson: true },
    });
    return toPersonResponse(person);
  }

  async softDelete(id: string) {
    await this.ensureActive(id);
    this.logger.log(`Soft deleting person ${id}`);
    const person = await this.prisma.person.update({
      where: { id },
      data: { deletedAt: new Date() },
      include: { familyPerson: true },
    });
    return toPersonResponse(person);
  }

  async ensureActive(id: string) {
    const person = await this.prisma.person.findUnique({ where: { id } });
    if (!person || person.deletedAt) {
      throw new DomainException(
        person?.deletedAt ? ErrorCode.PERSON_DELETED : ErrorCode.PERSON_NOT_FOUND,
        `Person ${id} not available`,
        HttpStatus.NOT_FOUND,
      );
    }
    return person;
  }

  async search(q: string, limit = 20) {
    const trimmed = q.trim();
    if (!trimmed) {
      return [];
    }
    const rows = await this.prisma.$queryRaw<
      { id: string; full_name: string; similarity: number }[]
    >(
      Prisma.sql`
        SELECT id, full_name,
               similarity(full_name, ${trimmed}) AS similarity
        FROM person
        WHERE deleted_at IS NULL
          AND (
            full_name ILIKE ${'%' + trimmed + '%'}
            OR full_name % ${trimmed}
          )
        ORDER BY similarity DESC, full_name
        LIMIT ${limit}
      `,
    );
    const ids = rows.map((r) => r.id);
    if (ids.length === 0) return [];
    const persons = await this.prisma.person.findMany({
      where: { id: { in: ids } },
      include: { familyPerson: true },
    });
    const order = new Map(ids.map((id, i) => [id, i]));
    persons.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
    return persons.map(toPersonResponse);
  }

  private validateDates(birthDate?: string, deathDate?: string) {
    if (birthDate && deathDate && new Date(deathDate) < new Date(birthDate)) {
      throw new DomainException(
        ErrorCode.INVALID_PARENT_RELATIONSHIP,
        'deathDate must be >= birthDate',
      );
    }
  }
}
