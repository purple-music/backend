import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit() {
    await this.$connect();

    const studios = [{ id: 'purple' }, { id: 'orange' }, { id: 'blue' }];

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
