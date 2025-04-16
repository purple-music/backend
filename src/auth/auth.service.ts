import { ConflictException, Injectable } from '@nestjs/common';
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
      const email = profile.emails?.[0]?.value;
      // const yandexAccountId = `yandex:${profile.id}`;

      // 1. Check if Yandex account exists
      const existingAccount = await tx.authAccount.findUnique({
        where: {
          provider_providerAccountId: {
            provider: 'yandex',
            providerAccountId: profile.id,
          },
        },
        include: { user: true },
      });

      if (existingAccount) return existingAccount.user;

      // 2. If email exists, DON'T auto-merge - throw error
      if (email) {
        const existingUser = await tx.user.findUnique({ where: { email } });
        if (existingUser) {
          throw new ConflictException(
            'Email already registered. Please sign in via email first to link accounts.',
          );
        }
      }

      // 3. Create new account
      return tx.user.create({
        data: {
          name: profile.displayName || `user-${profile.id.slice(0, 5)}`,
          email: email,
          image: profile.photos?.[0]?.value,
          accounts: {
            create: {
              provider: 'yandex',
              providerAccountId: profile.id,
            },
          },
        },
      });
    });
  }

  generateJwt(user: { id: string; email?: string }) {
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

  // Add to your AuthService
  async validateTelegramUser(profile: {
    id: string;
    firstName: string;
    lastName?: string;
    username?: string;
    photoUrl?: string;
  }): Promise<User> {
    return this.prisma.$transaction(async (tx) => {
      // Check if Telegram account already exists
      const existingAccount = await tx.authAccount.findUnique({
        where: {
          provider_providerAccountId: {
            provider: 'telegram',
            providerAccountId: profile.id,
          },
        },
        include: { user: true },
      });

      if (existingAccount) return existingAccount.user;

      // Create new user with Telegram account
      return tx.user.create({
        data: {
          name: [profile.firstName, profile.lastName]
            .filter(Boolean)
            .join(' ')
            .trim(),
          image: profile.photoUrl,
          accounts: {
            create: {
              provider: 'telegram',
              providerAccountId: profile.id,
            },
          },
        },
      });
    });
  }
}
