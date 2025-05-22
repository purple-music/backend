import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit() {
    await this.$connect();

    const studios = [
      { id: 'purple', hourlyRate: new Prisma.Decimal(500.0) },
      { id: 'orange', hourlyRate: new Prisma.Decimal(500.0) },
      { id: 'blue', hourlyRate: new Prisma.Decimal(600.0) },
    ];

    for (const studio of studios) {
      await this.studio.upsert({
        where: { id: studio.id },
        update: {},
        create: studio,
      });
    }
    console.log('Studios are initialized!');
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
