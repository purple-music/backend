import {
  Controller,
  Post,
  UseGuards,
  Req,
  Get,
  Body,
  UnauthorizedException,
  Res,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { EmailAuthGuard } from './email-auth.guard';
import { JwtAuthGuard } from './jwt-auth-guard';
import {
  ApiCreatedResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { VerifyEmailDto } from './dtos/verify-email.dto';
import { VerifyEmailResponseDto } from './dtos/verify-email-response.dto';
import { ApiValidationResponse } from '../common/api-validation-response.decorator';
import { RegisterResponseDto } from './dtos/register-response.dto';
import { RegisterDto } from './dtos/register.dto';
import { LoginResponseDto } from './dtos/login-response.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // TODO: consider using ApiCookieAuth() decorator
  @UseGuards(EmailAuthGuard)
  @Post('login')
  @ApiValidationResponse()
  @ApiResponse({ status: 200, type: LoginResponseDto })
  login(@Req() req: Request, @Res() res: Response) {
    if (!req.user || !req.user.email) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const accessToken = this.authService.login({
      email: req.user.email,
      id: req.user.id,
    });

    res.cookie('token', accessToken.access_token, {
      httpOnly: true, // Prevents client-side access
      secure: process.env.NODE_ENV === 'production', // Only send over HTTPS in production
      sameSite: 'strict', // Prevents CSRF attacks
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/', // Accessible across the entire site
    });

    return res.status(200).json({
      message: 'Login successful',
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
  @ApiOperation({ summary: 'Register user' })
  @ApiCreatedResponse({
    description: 'User registered.',
    type: RegisterResponseDto,
  })
  async register(@Body() body: RegisterDto) {
    return this.authService.register(body.email, body.password, body.name);
  }

  @Post('verify')
  @ApiOperation({ summary: 'Verify email token' })
  @ApiCreatedResponse({
    description: 'Verification success.',
    type: VerifyEmailResponseDto,
  })
  @ApiValidationResponse()
  async verify(@Body() body: VerifyEmailDto) {
    return this.authService.verifyEmailToken(body.token);
  }
}
