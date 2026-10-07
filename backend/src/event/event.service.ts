import { HttpStatus, Injectable } from '@nestjs/common';
import { ErrorCode } from '../common/errors/error-codes';
import { DomainException } from '../common/errors/domain.exception';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EventService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.familyEvent.findMany({
      orderBy: { eventDate: 'desc' },
      include: { participants: true },
    });
  }

  async findById(id: string) {
    const event = await this.prisma.familyEvent.findUnique({
      where: { id },
      include: { participants: true },
    });
    if (!event) {
      throw new DomainException(
        ErrorCode.EVENT_NOT_FOUND,
        `Event ${id} not found`,
        HttpStatus.NOT_FOUND,
      );
    }
    return event;
  }
}
