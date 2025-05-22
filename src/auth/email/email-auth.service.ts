import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../../users/users.service';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma, User } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { ConfigService } from '@nestjs/config';
import { ValidationException } from '../../common/validation-exception';
import { EmailTokenService } from './email-token.service';
import { EmailSenderService } from './email-sender.service';

@Injectable()
export class EmailAuthService {
  constructor(
    private usersService: UsersService,
    private tokenService: EmailTokenService,
    private prisma: PrismaService,
    private emailSenderService: EmailSenderService,
    private configService: ConfigService,
  ) {}

  async validateUserByEmail(
    email: string,
    password: string,
  ): Promise<Omit<User, 'passwordHash'> | null> {
    const user = await this.usersService.findByEmail(email);

    if (!user || !user.passwordHash) {
      return null;
    }

    if (user && bcrypt.compareSync(password, user.passwordHash)) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { passwordHash, ...result } = user;
      return result;
    }

    return null;
  }

  async register(email: string, password: string, name: string) {
    const salt = +this.configService.get<number>('BCRYPT_SALT_ROUNDS', 10);
    const hashedPassword = await bcrypt.hash(password, salt);

    try {
      const user = await this.usersService.createEmailAccount(
        email,
        hashedPassword,
        name,
      );

      if (!user.email) {
        throw ValidationException.format('email', 'No email found for user');
      }

      const entry = await this.tokenService.generateEmailVerificationToken(
        user.email,
      );

      await this.emailSenderService.sendVerificationEmail(email, entry.token);

      return { message: 'User registered. Check your email for verification' };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw ValidationException.format('email', 'Email already exists');
        }
      }

      throw error;
    }
  }

  async verifyEmailToken(token: string) {
    const verification = await this.tokenService.verifyEmailToken(token);

    // Set email as verified
    await this.usersService.markEmailAsVerified(verification.email);

    // Delete token
    await this.prisma.emailVerificationToken.delete({ where: { token } });

    return { message: 'Email verified successfully' };
  }

  async requestPasswordReset(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw ValidationException.format('email', 'User not found');
    }

    const resetToken =
      await this.tokenService.generatePasswordResetToken(email);
    await this.emailSenderService.sendPasswordResetEmail(
      email,
      resetToken.token,
    );

    return { message: 'Password reset email sent' };
  }

  async resetPassword(token: string, newPassword: string) {
    const resetRecord = await this.tokenService.verifyPasswordResetToken(token);
    const hashedPassword = await bcrypt.hash(
      newPassword,
      this.configService.get<number>('BCRYPT_SALT_ROUNDS', 10),
    );

    const user = await this.usersService.findByEmail(resetRecord.email);
    if (!user) {
      throw ValidationException.format('email', 'User not found');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: hashedPassword },
    });

    // Delete token
    await this.prisma.passwordResetToken.delete({ where: { token } });

    return { message: 'Password reset successfully' };
  }
}
