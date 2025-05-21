import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { PrismaService } from './prisma.service';
import { TimeSlotsModule } from './time-slots/time-slots.module';
import { TimeSlotsService } from './time-slots/time-slots.service';
import { BookingsModule } from './bookings/bookings.module';
import { FreeSlotsModule } from './free-slots/free-slots.module';
import { StudiosModule } from './studios/studios.module';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/core/auth.module';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    TimeSlotsModule,
    BookingsModule,
    FreeSlotsModule,
    StudiosModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService, TimeSlotsService],
})
export class AppModule {}
