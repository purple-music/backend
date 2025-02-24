import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  createUser(email: string, password: string, name: string): Promise<User> {
    return this.prisma.user.create({
      data: { email, password, name },
    });
  }

  markEmailAsVerified(email: string): Promise<User> {
    return this.prisma.user.update({
      where: { email },
      data: { emailVerified: new Date() },
    });
  }
}
