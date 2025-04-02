import { Module } from '@nestjs/common';
import { StudiosService } from './studios.service';
import { StudiosController } from './studios.controller';
import { PrismaService } from '../prisma.service';

@Module({
  providers: [StudiosService, PrismaService],
  controllers: [StudiosController],
})
export class StudiosModule {}
