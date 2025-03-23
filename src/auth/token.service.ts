import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { v4 as uuid } from 'uuid';
import { tokenConstants } from './constants';
import { add } from 'date-fns';

@Injectable()
export class TokenService {
  constructor(private readonly prisma: PrismaService) {}

  public generateEmailVerificationToken(email: string) {
    const expiresAt = add(new Date(), {
      hours: tokenConstants.emailVerificationExpiryHours,
    });

    return this.prisma.verificationToken.upsert({
      where: { email },
      create: {
        email,
        token: uuid(),
        expiresAt,
      },
      update: {
        token: uuid(),
        expiresAt,
      },
    });
  }

  public generatePasswordResetToken(email: string) {
    const expiresAt = add(new Date(), {
      hours: tokenConstants.passwordResetExpiryHours,
    });

    return this.prisma.passwordResetToken.upsert({
      where: { email },
      create: {
        email,
        token: uuid(),
        expiresAt,
      },
      update: {
        token: uuid(),
        expiresAt,
      },
    });
  }
}
