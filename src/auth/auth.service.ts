import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { Prisma, User } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { TokenService } from './token.service';
import { PrismaService } from '../prisma.service';
import { EmailService } from './email.service';
import { ValidationException } from '../common/validation-exception';
import { Profile as YandexProfile } from 'passport-yandex';
import { JwtPayload } from 'jsonwebtoken';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private tokenService: TokenService,
    private prisma: PrismaService,
    private emailService: EmailService,
    private configService: ConfigService,
  ) {}

  async validateUserByEmail(
    email: string,
    password: string,
  ): Promise<Omit<User, 'passwordHash'> | null> {
    // Find the user with their associated email-based account
    const user = await this.usersService.findByEmail(email);

    if (!user || !user.passwordHash) {
      return null;
    }

    // Compare the provided password with the stored hash
    if (user && bcrypt.compareSync(password, user.passwordHash)) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { passwordHash, ...result } = user;
      return result;
    }

    return null;
  }

  async validateYandexUser(profile: YandexProfile) {
    return this.prisma.$transaction(async (tx) => {
      // Find the user with their associated email-based account
      const account = await tx.authAccount.findUnique({
        where: {
          provider_providerAccountId: {
            provider: 'yandex',
            providerAccountId: profile.id,
          },
        },
        include: { user: true },
      });

      if (account?.user) return account.user;

      // If the user doesn't exist, create a new one
      return tx.user.create({
        data: {
          name: profile.displayName || `user-${profile.id.slice(0, 5)}`,
          email: profile.emails?.[0]?.value,
          accounts: {
            create: {
              provider: 'yandex',
              providerAccountId: profile.id,
              // NOTE: accessToken и refreshToken only if needed
            },
          },
          image: profile.photos?.[0]?.value,
        },
      });
    });
  }

  generateJwt(user: { id: string; email: string }) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      iss: this.configService.get<string>('JWT_ISSUER'),
      aud: this.configService.get<string>('JWT_AUDIENCE'),
    };

    return {
      accessToken: this.jwtService.sign(payload, {
        expiresIn: this.configService.get<string>(
          'JWT_ACCESS_TOKEN_EXPIRATION',
          '15m',
        ),
      }),
      refreshToken: this.jwtService.sign(payload, {
        expiresIn: this.configService.get<string>(
          'JWT_REFRESH_TOKEN_EXPIRATION',
          '7d',
        ),
      }),
    };
  }

  async register(email: string, password: string, name: string) {
    const hashedPassword = await bcrypt.hash(
      password,
      this.configService.get<number>('BCRYPT_SALT_ROUNDS', 10),
    );

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

      await this.emailService.sendVerificationEmail(email, entry.token);

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
    await this.emailService.sendPasswordResetEmail(email, resetToken.token);

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
