import { Controller, Get, Post, UseGuards, Req } from '@nestjs/common';
import { AppService } from './app.service';
import { Request } from 'express';
import { EmailAuthGuard } from './auth/email-auth.guard';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @UseGuards(EmailAuthGuard)
  @Post('/auth/login')
  login(@Req() req: Request) {
    return req.user;
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
}
