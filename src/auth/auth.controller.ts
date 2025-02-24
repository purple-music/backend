import { Controller, Post, UseGuards, Req, Get, Body } from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { EmailAuthGuard } from './email-auth.guard';
import { JwtAuthGuard } from './jwt-auth-guard';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { VerifyEmailDto } from './dtos/verify-email.dto';
import { ErrorResponseDto } from './dtos/error-response.dto';
import { VerifyEmailResponseDto } from './dtos/verify-email-response.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @UseGuards(EmailAuthGuard)
  @Post('login')
  login(@Req() req: Request) {
    if (!req.user || !req.user.email) {
      return { error: 'Unauthorized' };
    }
    return this.authService.login({
      email: req.user.email,
      id: req.user.id,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
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

  @Post('register')
  async register(
    @Body() body: { email: string; password: string; name: string },
  ) {
    return this.authService.register(body.email, body.password, body.name);
  }

  @Post('verify')
  @ApiOperation({ summary: 'Verify email token' })
  @ApiResponse({
    status: 200,
    description: 'Verification success',
    type: VerifyEmailResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid or expired token',
    type: ErrorResponseDto,
  })
  async verify(@Body() body: VerifyEmailDto) {
    return this.authService.verifyEmailToken(body.token);
  }
}
