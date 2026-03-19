import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { createPaginatedResult } from '../../common/pagination/paginated-result.interface';
import { PaginationDto } from '../../common/pagination/pagination.dto';
import { PrismaService } from '../../database/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  private readonly userSelect = {
    id: true,
    name: true,
    email: true,
    isActive: true,
    createdAt: true,
    updatedAt: true,
    deletedAt: true,
    roles: {
      include: {
        role: {
          include: {
            permissions: {
              include: { permission: true },
            },
          },
        },
      },
    },
  };

  async findAll(paginationDto: PaginationDto) {
    const { page = 1, limit = 10, search, orderBy = 'createdAt', orderDir = 'desc' } = paginationDto;
    const skip = (page - 1) * limit;

    const where: any = { deletedAt: null };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const allowedOrderFields = ['name', 'email', 'createdAt', 'isActive'];
    const orderField = allowedOrderFields.includes(orderBy) ? orderBy : 'createdAt';

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: this.userSelect,
        skip,
        take: limit,
        orderBy: { [orderField]: orderDir },
      }),
      this.prisma.user.count({ where }),
    ]);

    return createPaginatedResult(users, total, page, limit);
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id, deletedAt: null },
      select: this.userSelect,
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async create(createUserDto: CreateUserDto) {
    const { password, roleIds, ...userData } = createUserDto;

    const existingUser = await this.prisma.user.findUnique({
      where: { email: userData.email },
    });

    if (existingUser) {
      throw new ConflictException(`User with email ${userData.email} already exists`);
    }

    const bcryptRounds = parseInt(process.env.BCRYPT_ROUNDS, 10) || 12;
    const passwordHash = await bcrypt.hash(password, bcryptRounds);

    const user = await this.prisma.user.create({
      data: {
        ...userData,
        passwordHash,
        roles: roleIds
          ? {
              create: roleIds.map((roleId) => ({ roleId })),
            }
          : undefined,
      },
      select: this.userSelect,
    });

    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    await this.findOne(id);

    const { password, roleIds, ...userData } = updateUserDto;

    if (userData.email) {
      const existingUser = await this.prisma.user.findFirst({
        where: { email: userData.email, id: { not: id }, deletedAt: null },
      });

      if (existingUser) {
        throw new ConflictException(`Email ${userData.email} is already taken`);
      }
    }

    const updateData: any = { ...userData };

    if (password) {
      const bcryptRounds = parseInt(process.env.BCRYPT_ROUNDS, 10) || 12;
      updateData.passwordHash = await bcrypt.hash(password, bcryptRounds);
    }

    if (roleIds !== undefined) {
      // Replace all roles
      await this.prisma.userRole.deleteMany({ where: { userId: id } });
      updateData.roles = {
        create: roleIds.map((roleId) => ({ roleId })),
      };
    }

    const user = await this.prisma.user.update({
      where: { id },
      data: updateData,
      select: this.userSelect,
    });

    return user;
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });

    return { message: `User ${id} soft-deleted successfully` };
  }
}
