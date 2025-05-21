import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { User } from '@prisma/client';

@Injectable()
export class TelegramAuthService {
  constructor(private prisma: PrismaService) {}

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
