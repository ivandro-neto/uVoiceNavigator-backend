import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

/**
 * AudiosRepository provides low-level database access methods for the Audios domain.
 */
@Injectable()
export class AudiosRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    return this.prisma.audio.findUnique({ where: { id } });
  }

  async findPendingBatch(limit: number = 50) {
    return this.prisma.audio.findMany({
      where: { status: 'pending' },
      take: limit,
      orderBy: { uploadedAt: 'asc' },
    });
  }

  async countByStatus(status: string) {
    return this.prisma.audio.count({ where: { status } });
  }

  async countBySource(source: string) {
    return this.prisma.audio.count({ where: { source } });
  }

  async getTotalStorageUsed(): Promise<number> {
    const result = await this.prisma.audio.aggregate({
      _sum: { fileSize: true },
    });
    return result._sum.fileSize || 0;
  }
}
