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

  findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async createEmailAccount(
    email: string,
    passwordHash: string,
    name: string,
  ): Promise<User> {
    return this.prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
      },
    });
  }

  markEmailAsVerified(email: string): Promise<User> {
    return this.prisma.user.update({
      where: { email },
      data: { emailVerifiedAt: new Date() },
    });
  }
}
