import { BadRequestException, Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { User } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { TokenService } from './token.service';
import { PrismaService } from '../prisma.service';
import { EmailService } from './email.service';

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
    pass: string,
  ): Promise<Omit<User, 'password'> | null> {
    const user = await this.usersService.findByEmail(email);

    if (!user || !user.password) return null;

    if (user && bcrypt.compareSync(pass, user.password)) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...result } = user;
      return result;
    }

    return null;
  }

  login(user: LoginUser) {
    const payload = { email: user.email, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async register(email: string, password: string) {
    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) {
      throw new BadRequestException('Email already in use');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.usersService.createUser(email, hashedPassword);

    if (!user) throw new BadRequestException('Failed to create user');

    if (!user.email) throw new BadRequestException('No email found for user');

    const entry = await this.tokenService.generateEmailVerificationToken(
      user.email,
    );
    await this.prisma.verificationToken.create({
      data: {
        email,
        token: entry.token,
        expires: new Date(Date.now() + 3600 * 1000),
      },
    });

    await this.emailService.sendVerificationEmail(email, entry.token);

    return { message: 'User registered. Check your email for verification' };
  }

  async verifyEmailToken(token: string) {
    const record = await this.prisma.verificationToken.findUnique({
      where: { token },
    });

    if (!record || record.expires < new Date()) {
      throw new BadRequestException('Token is invalid or expired');
    }

    // Set email as verified
    await this.usersService.markEmailAsVerified(record.email);

    // Delete token
    await this.prisma.verificationToken.delete({ where: { token } });

    return { message: 'Email verified successfully' };
  }
}
