import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { StudiosResponseDto } from './dtos/studio.dto';

@Injectable()
export class StudiosService {
  constructor(private prisma: PrismaService) {}

  async getStudios(): Promise<StudiosResponseDto> {
    const studios = await this.prisma.studio.findMany();
    return {
      studios,
    };
  }
}
