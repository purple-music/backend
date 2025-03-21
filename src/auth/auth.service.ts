import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { User } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { TokenService } from './token.service';
import { PrismaService } from '../prisma.service';
import { EmailService } from './email.service';
import { ValidationException } from '../common/validation-exception';

type LoginUser = {
  email: string;
  id: string;
};

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private tokenService: TokenService,
    private prisma: PrismaService,
    private emailService: EmailService,
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

  login(user: LoginUser) {
    const payload = { email: user.email, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload, {
        secret: process.env.JWT_SECRET,
        expiresIn: '7d',
      }),
    };
  }

  async register(email: string, password: string, name: string) {
    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) {
      throw ValidationException.format('email', 'Email already in use');
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await this.usersService.createEmailAccount(
      email,
      passwordHash,
      name,
    );

    if (!user) {
      throw ValidationException.format('email', 'Failed to create user');
    }
    if (!user.email) {
      throw ValidationException.format('email', 'No email found for user');
    }

    const entry = await this.tokenService.generateEmailVerificationToken(
      user.email,
    );

    await this.emailService.sendVerificationEmail(email, entry.token);

    return { message: 'User registered. Check your email for verification' };
  }

  async verifyEmailToken(token: string) {
    const record = await this.prisma.verificationToken.findUnique({
      where: { token },
    });

    if (!record || record.expiresAt < new Date()) {
      throw ValidationException.format('token', 'Token is invalid or expired');
    }

    // Set email as verified
    await this.usersService.markEmailAsVerified(record.email);

    // Delete token
    await this.prisma.verificationToken.delete({ where: { token } });

    return { message: 'Email verified successfully' };
  }

  async resetPassword(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw ValidationException.format('email', 'User not found');
    }

    if (!user.email) {
      throw ValidationException.format('email', 'No email found for user');
    }

    const entry = await this.tokenService.generatePasswordResetToken(
      user.email,
    );

    await this.emailService.sendPasswordResetEmail(email, entry.token);

    return { message: 'Password reset email sent' };
  }

  async newPassword(token: string, password: string) {
    const record = await this.prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!record || record.expiresAt < new Date()) {
      throw ValidationException.format('token', 'Token is invalid or expired');
    }

    const user = await this.usersService.findByEmail(record.email);
    if (!user) {
      throw ValidationException.format('email', 'User not found');
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    // Delete token
    await this.prisma.passwordResetToken.delete({ where: { token } });

    return { message: 'Password reset successfully' };
  }
}
