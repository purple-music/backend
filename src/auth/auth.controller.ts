import {
  Body,
  Controller,
  Get,
  HttpStatus,
  InternalServerErrorException,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { EmailAuthGuard } from './email-auth.guard';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiExcludeEndpoint,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
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
import { UnauthorizedResponseDto } from '../common/dtos/unauthorized-response.dto';
import { LogoutResponseDto } from './dtos/logout-response.dto';
import { ResetPasswordRequestDto } from './dtos/reset-password-request.dto';
import { ResetPasswordResponseDto } from './dtos/reset-password-response.dto';
import { NewPasswordRequestDto } from './dtos/new-password-request.dto';
import { NewPasswordResponseDto } from './dtos/new-password-response.dto';
import { ApiJwtUnauthorizedResponse } from '../common/api-jwt-unauthorized-response.decorator';
import { AuthGuard } from '@nestjs/passport';

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
  @ApiJwtUnauthorizedResponse() // 401
  @ApiOkResponse({ type: LoginResponseDto })
  login(@Req() req: Request, @Res() res: Response) {
    if (!req.user || !req.user.email) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const accessToken = this.authService.generateJwt({
      email: req.user.email,
      id: req.user.id,
    });

    res.cookie('token', accessToken.accessToken, {
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
    return this.authService.requestPasswordReset(body.email);
  }

  @Post('new-password')
  @ApiOperation({ summary: 'New password' })
  @ApiBody({ type: NewPasswordRequestDto })
  @ApiValidationResponse() // 400
  @ApiCreatedResponse({ type: NewPasswordResponseDto }) // 201
  async newPassword(@Body() body: NewPasswordRequestDto) {
    return this.authService.resetPassword(body.token, body.password);
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

  // @Post('refresh')
  // @ApiOperation({ summary: 'Refresh access token' })
  // async refreshToken(@Req() req: Request, @Res() res: Response) {
  //   const refreshToken = req.cookies['refresh_token'];
  //   if (!refreshToken) {
  //     throw new UnauthorizedException('Refresh token missing');
  //   }
  //
  //   const newAccessToken =
  //     await this.authService.refreshAccessToken(refreshToken);
  //   res.cookie('access_token', newAccessToken, {
  //     httpOnly: true,
  //     secure: process.env.NODE_ENV === 'production',
  //     sameSite: 'strict',
  //   });
  //
  //   return res.json({ access_token: newAccessToken });
  // }

  @Get('yandex')
  @UseGuards(AuthGuard('yandex'))
  @ApiOperation({ summary: 'Initiate Yandex OAuth flow' })
  @ApiResponse({
    status: HttpStatus.FOUND,
    description: 'Redirects to Yandex OAuth page',
  })
  yandexAuth() {}

  @Get('callback/yandex')
  @UseGuards(AuthGuard('yandex'))
  @ApiExcludeEndpoint() // Hide from Swagger as this is a callback URL
  yandexAuthCallback(@Req() req: Request, @Res() res: Response) {
    if (!req.user || !req.user.email) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const { accessToken } = this.authService.generateJwt({
      id: req.user.id,
      email: req.user.email,
    });

    // Set tokens in a secure HTTP-only cookie
    res.cookie('token', accessToken, {
      httpOnly: true, // Prevents client-side access
      secure: process.env.NODE_ENV === 'production', // Only send over HTTPS in production
      sameSite: 'lax', // Prevents CSRF attacks
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/', // Accessible across the entire site
    });

    const redirectUrl = process.env.CLIENT_AUTH_SUCCESS_URL;

    if (!redirectUrl) {
      throw new InternalServerErrorException(
        'Missing CLIENT_AUTH_SUCCESS_URL environment variable',
      );
    }

    return res.redirect(redirectUrl);
  }

  @Get('telegram')
  @UseGuards(AuthGuard('telegram'))
  @ApiOperation({ summary: 'Initiate Telegram authentication' })
  @ApiResponse({
    status: 302,
    description: 'Redirects to Telegram authentication',
  })
  telegramAuth() {
    // Empty as Passport handles the redirect
  }

  @Get('callback/telegram')
  @UseGuards(AuthGuard('telegram'))
  @ApiExcludeEndpoint()
  telegramAuthCallback(@Req() req: Request, @Res() res: Response) {
    if (!req.user) {
      throw new UnauthorizedException('Invalid Telegram credentials');
    }

    // Generate JWT (implement this in your auth service)
    const { accessToken } = this.authService.generateJwt({
      id: req.user.id,
    });

    // Set secure HTTP-only cookie
    res.cookie('token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/',
    });

    // Redirect to frontend success URL
    const redirectUrl = process.env.CLIENT_AUTH_SUCCESS_URL;
    if (!redirectUrl) {
      throw new Error('CLIENT_AUTH_SUCCESS_URL not configured');
    }

    return res.redirect(redirectUrl);

    // TODO: add error handling
    // try {
    //   // ... existing code ...
    // } catch (error) {
    //   const errorUrl = new URL(process.env.CLIENT_AUTH_ERROR_URL);
    //   errorUrl.searchParams.set('error', error.message);
    //   return res.redirect(errorUrl.toString());
    // }
  }
}
