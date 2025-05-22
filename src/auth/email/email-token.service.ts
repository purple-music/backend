import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { v4 as uuid } from 'uuid';
import { tokenConstants } from '../constants';
import { add } from 'date-fns';
import { ValidationException } from '../../common/validation-exception';

@Injectable()
export class EmailTokenService {
  constructor(private readonly prisma: PrismaService) {}

  public generateEmailVerificationToken(email: string) {
    const expiresAt = add(new Date(), {
      hours: tokenConstants.emailVerificationExpiryHours,
    });

    return this.prisma.emailVerificationToken.upsert({
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

  public async deleteEmailVerificationToken(email: string) {
    await this.prisma.emailVerificationToken.delete({
      where: { email },
    });
  }

  public async verifyEmailToken(token: string) {
    const record = await this.prisma.emailVerificationToken.findUnique({
      where: { token },
    });

    if (!record || record.expiresAt < new Date()) {
      throw ValidationException.format('token', 'Token is invalid or expired');
    }

    return record;
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

  public async deletePasswordResetToken(email: string) {
    await this.prisma.passwordResetToken.delete({
      where: { email },
    });
  }

  public async verifyPasswordResetToken(token: string) {
    const record = await this.prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!record || record.expiresAt < new Date()) {
      throw ValidationException.format('token', 'Token is invalid or expired');
    }

    return record;
  }
}
