import { Controller, Post, UseGuards, Req, Get } from '@nestjs/common';
import { Request } from 'express';
import { EmailAuthGuard } from './auth/email-auth.guard';
import { AuthService } from './auth/auth.service';
import { JwtAuthGuard } from './auth/jwt-auth-guard';

@Controller()
export class AppController {
  constructor(private authService: AuthService) {}

  @UseGuards(EmailAuthGuard)
  @Post('/auth/login')
  login(@Req() req: Request) {
    if (!req.user || !req.user.email) {
      return { error: 'Unauthorized' };
    }
    return this.authService.login({
      email: req.user.email,
      id: req.user.id,
    });
  }

  @UseGuards(EmailAuthGuard)
  @Post('auth/logout')
  async logout(@Req() req: Request) {
    return new Promise((resolve, reject) => {
      req.logout((err: Error) => {
        if (err) {
          console.error(`Error logging out: ${err}`);
          return reject(err);
        }
        resolve('Logged out successfully');
      });
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Req() req: Request) {
    return req.user;
  }
}
