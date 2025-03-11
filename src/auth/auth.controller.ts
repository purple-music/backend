import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { EmailAuthGuard } from './email-auth.guard';
import { JwtAuthGuard } from './jwt-auth-guard';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { VerifyEmailDto } from './dtos/verify-email.dto';
import { VerifyEmailResponseDto } from './dtos/verify-email-response.dto';
import { ApiValidationResponse } from '../common/api-validation-response.decorator';
import { RegisterResponseDto } from './dtos/register-response.dto';
import { RegisterRequestDto } from './dtos/register-request.dto';
import { LoginResponseDto } from './dtos/login-response.dto';
import { UsersService } from '../users/users.service';
import { ProfileResponseDto } from './dtos/profile-response.dto';
import { LoginRequestDto } from './dtos/login-request.dto';
import { UnauthorizedResponseDto } from './dtos/unauthorized-response.dto';
import { LogoutResponseDto } from './dtos/logout-response.dto';
import { ResetPasswordRequestDto } from './dtos/reset-password-request.dto';
import { ResetPasswordResponseDto } from './dtos/reset-password-response.dto';
import { NewPasswordRequestDto } from './dtos/new-password-request.dto';
import { NewPasswordResponseDto } from './dtos/new-password-response.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private userService: UsersService,
  ) {}

  @UseGuards(EmailAuthGuard)
  @Post('login')
  @ApiBody({ type: LoginRequestDto })
  @ApiValidationResponse() // 400
  @ApiUnauthorizedResponse({
    type: UnauthorizedResponseDto,
    description: 'Invalid credentials',
  }) // 401
  @ApiOkResponse({ type: LoginResponseDto })
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

  @Post('reset-password')
  @ApiOperation({ summary: 'Reset password' })
  @ApiBody({ type: ResetPasswordRequestDto })
  @ApiValidationResponse() // 400
  @ApiCreatedResponse({ type: ResetPasswordResponseDto }) // 201
  async resetPassword(@Body() body: ResetPasswordRequestDto) {
    return this.authService.resetPassword(body.email);
  }

  @Post('new-password')
  @ApiOperation({ summary: 'New password' })
  @ApiBody({ type: NewPasswordRequestDto })
  @ApiValidationResponse() // 400
  @ApiCreatedResponse({ type: NewPasswordResponseDto }) // 201
  async newPassword(@Body() body: NewPasswordRequestDto) {
    return this.authService.newPassword(body.token, body.password);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @ApiOkResponse({ type: LogoutResponseDto })
  logout(@Req() req: Request, @Res() res: Response) {
    res.clearCookie('token', {
      httpOnly: true, // Prevents client-side access
      secure: process.env.NODE_ENV === 'production', // Only send over HTTPS in production
      sameSite: 'strict', // Prevents CSRF attacks
      path: '/', // Clear cookie across the entire site
    });

    return res.status(200).json({ message: 'Logout successful' });
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiOperation({ summary: 'Get user profile' })
  @ApiResponse({
    status: 200,
    description: 'User profile',
    type: ProfileResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: UnauthorizedResponseDto,
  })
  async profile(@Req() req: Request) {
    if (!req.user || !req.user.email) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const user = await this.userService.findByEmail(req.user.email);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      image: user.image,
    };
  }

  @Post('register')
  @ApiOperation({ summary: 'Register user' })
  @ApiBody({ type: RegisterRequestDto })
  @ApiCreatedResponse({
    description: 'User registered',
    type: RegisterResponseDto,
  })
  @ApiValidationResponse()
  async register(@Body() body: RegisterRequestDto) {
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
