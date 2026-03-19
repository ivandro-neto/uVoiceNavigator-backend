import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

/**
 * InteractionsRepository provides low-level database access methods for the Interactions domain.
 */
@Injectable()
export class InteractionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    return this.prisma.interaction.findUnique({ where: { id } });
  }

  async countByStatus(status: string) {
    return this.prisma.interaction.count({ where: { status } });
  }

  async countByRecordType(recordType: 'inbound' | 'outbound') {
    return this.prisma.interaction.count({ where: { recordType } });
  }

  async findPendingBatch(limit: number = 100) {
    return this.prisma.interaction.findMany({
      where: { status: 'pending' },
      take: limit,
      orderBy: { createdAt: 'asc' },
    });
  }
}
