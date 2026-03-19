import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreatePermissionDto } from './dto/create-permission.dto';

@Injectable()
export class PermissionsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.permission.findMany({
      orderBy: [{ resource: 'asc' }, { action: 'asc' }],
    });
  }

  async findOne(id: string) {
    const permission = await this.prisma.permission.findUnique({ where: { id } });

    if (!permission) {
      throw new NotFoundException(`Permission with ID ${id} not found`);
    }

    return permission;
  }

  async create(createPermissionDto: CreatePermissionDto) {
    const { resource, action } = createPermissionDto;
    const name = `${resource}:${action}`;

    const existing = await this.prisma.permission.findFirst({
      where: { resource, action },
    });

    if (existing) {
      throw new ConflictException(`Permission '${name}' already exists`);
    }

    return this.prisma.permission.create({
      data: { name, resource, action },
    });
  }

  async seedDefaultPermissions() {
    const resources = ['interactions', 'audios', 'alerts', 'dashboard', 'users', 'roles', 'permissions'];
    const actions = ['read', 'write', 'delete', 'manage'];

    const permissions = [];

    for (const resource of resources) {
      for (const action of actions) {
        permissions.push({ resource, action, name: `${resource}:${action}` });
      }
    }

    for (const perm of permissions) {
      await this.prisma.permission.upsert({
        where: { resource_action: { resource: perm.resource, action: perm.action } },
        update: {},
        create: perm,
      });
    }

    return this.findAll();
  }
}
