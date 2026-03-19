import { Module } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { InteractionsController } from './interactions.controller';
import { InteractionsService } from './interactions.service';

@Module({
  controllers: [InteractionsController],
  providers: [InteractionsService, PrismaService],
  exports: [InteractionsService],
})
export class InteractionsModule {}
