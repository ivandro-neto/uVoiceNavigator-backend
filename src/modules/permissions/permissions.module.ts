import { Module } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { PermissionsService } from './permissions.service';

@Module({
  providers: [PermissionsService, PrismaService],
  exports: [PermissionsService],
})
export class PermissionsModule {}
