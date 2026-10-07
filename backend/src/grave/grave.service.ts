import { HttpStatus, Injectable } from '@nestjs/common';
import { ErrorCode } from '../common/errors/error-codes';
import { DomainException } from '../common/errors/domain.exception';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GraveService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.grave.findMany({ orderBy: { name: 'asc' } });
  }

  async findById(id: string) {
    const grave = await this.prisma.grave.findUnique({ where: { id } });
    if (!grave) {
      throw new DomainException(
        ErrorCode.GRAVE_NOT_FOUND,
        `Grave ${id} not found`,
        HttpStatus.NOT_FOUND,
      );
    }
    return grave;
  }
}
