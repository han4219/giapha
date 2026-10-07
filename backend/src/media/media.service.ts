import { HttpStatus, Injectable } from '@nestjs/common';
import { MediaOwnerType } from '@prisma/client';
import { ErrorCode } from '../common/errors/error-codes';
import { DomainException } from '../common/errors/domain.exception';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMediaDto } from './dto/create-media.dto';

@Injectable()
export class MediaService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateMediaDto) {
    await this.validateOwner(dto.ownerType, dto.ownerId);
    return this.prisma.media.create({
      data: {
        ownerType: dto.ownerType,
        ownerId: dto.ownerId,
        mediaType: dto.mediaType,
        fileUrl: dto.fileUrl,
        fileName: dto.fileName,
        thumbnailUrl: dto.thumbnailUrl,
        sortOrder: dto.sortOrder ?? 0,
      },
    });
  }

  private async validateOwner(ownerType: MediaOwnerType, ownerId: string) {
    switch (ownerType) {
      case MediaOwnerType.PERSON: {
        const p = await this.prisma.person.findFirst({
          where: { id: ownerId, deletedAt: null },
        });
        if (!p) throw this.notFound();
        return;
      }
      case MediaOwnerType.GRAVE: {
        const g = await this.prisma.grave.findUnique({ where: { id: ownerId } });
        if (!g) throw this.notFound();
        return;
      }
      case MediaOwnerType.EVENT: {
        const e = await this.prisma.familyEvent.findUnique({
          where: { id: ownerId },
        });
        if (!e) throw this.notFound();
        return;
      }
      default:
        throw this.notFound();
    }
  }

  private notFound() {
    return new DomainException(
      ErrorCode.MEDIA_OWNER_NOT_FOUND,
      'Media owner not found',
      HttpStatus.BAD_REQUEST,
    );
  }
}
