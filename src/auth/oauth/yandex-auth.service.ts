import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Profile as YandexProfile } from 'passport-yandex';
import { User } from '@prisma/client';

@Injectable()
export class YandexAuthService {
  constructor(private prisma: PrismaService) {}

  async validateYandexUser(profile: YandexProfile): Promise<User> {
    return this.prisma.$transaction(async (tx) => {
      const email = profile.emails?.[0]?.value;

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
}
