import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

/**
 * UsersRepository provides low-level database access methods for the Users domain.
 * Business logic should remain in UsersService.
 */
@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id, deletedAt: null },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: { include: { permission: true } },
              },
            },
          },
        },
      },
    });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async existsByEmail(email: string, excludeId?: string) {
    const where: any = { email };
    if (excludeId) {
      where.id = { not: excludeId };
    }
    return (await this.prisma.user.count({ where })) > 0;
  }
}
