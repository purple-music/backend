import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { v4 as uuid } from 'uuid';
import { tokenConstants } from './constants';

@Injectable()
export class TokenService {
  constructor(private readonly prisma: PrismaService) {}

  public generateEmailVerificationToken(email: string) {
    const expiresAt = new Date(
      Date.now() + tokenConstants.emailVerificationExpiry,
    );

    return this.prisma.verificationToken.upsert({
      where: { email },
      create: {
        email,
        token: uuid(),
        expires: expiresAt,
      },
      update: {
        token: uuid(),
        expires: expiresAt,
      },
    });
  }

  public generatePasswordResetToken(email: string) {
    const expiresAt = new Date(Date.now() + tokenConstants.passwordResetExpiry);

    return this.prisma.passwordResetToken.upsert({
      where: { email },
      create: {
        email,
        token: uuid(),
        expires: expiresAt,
      },
      update: {
        token: uuid(),
        expires: expiresAt,
      },
    });
  }
}
