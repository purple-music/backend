import {
  Body,
  Controller,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ApiJwtUnauthorizedResponse } from '../../common/api-jwt-unauthorized-response.decorator';
import { EmailAuthService } from './email-auth.service';
import { EmailAuthGuard } from './email-auth.guard';
import { ApiValidationResponse } from '../../common/api-validation-response.decorator';
import { LoginRequestDto } from './dtos/login-request.dto';
import { LoginResponseDto } from './dtos/login-response.dto';
import { RegisterRequestDto } from './dtos/register-request.dto';
import { RegisterResponseDto } from './dtos/register-response.dto';
import { VerifyEmailResponseDto } from './dtos/verify-email-response.dto';
import { VerifyEmailDto } from './dtos/verify-email.dto';
import { ResetPasswordRequestDto } from './dtos/reset-password-request.dto';
import { NewPasswordRequestDto } from './dtos/new-password-request.dto';
import { NewPasswordResponseDto } from './dtos/new-password-response.dto';
import { ResetPasswordResponseDto } from './dtos/reset-password-response.dto';
import { JwtTokensService } from '../core/tokens/jwt-tokens.service';

@ApiTags('Email Authentication')
@Controller('auth')
export class EmailAuthController {
  constructor(
    private emailAuthService: EmailAuthService,
    private jwtTokensService: JwtTokensService,
  ) {}

  @UseGuards(EmailAuthGuard)
  @Post('login')
  @ApiBody({ type: LoginRequestDto })
  @ApiValidationResponse()
  @ApiJwtUnauthorizedResponse()
  @ApiOkResponse({ type: LoginResponseDto })
  async login(@Req() req: Request, @Res() res: Response) {
    if (!req.user || !req.user.email) {
      throw new UnauthorizedException('No email found');
    }

    const { accessToken, refreshToken } =
      await this.jwtTokensService.generateJwt({
        email: req.user.email,
        id: req.user.id,
      });

    this.jwtTokensService.addTokensToCookies(res, accessToken, refreshToken);

    return res.status(200).json({
      message: 'Login successful',
    });
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
    return this.emailAuthService.register(body.email, body.password, body.name);
  }

  @Post('verify')
  @ApiOperation({ summary: 'Verify email token' })
  @ApiCreatedResponse({
    description: 'Verification success.',
    type: VerifyEmailResponseDto,
  })
  @ApiValidationResponse()
  async verify(@Body() body: VerifyEmailDto) {
    return this.emailAuthService.verifyEmailToken(body.token);
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Reset password' })
  @ApiBody({ type: ResetPasswordRequestDto })
  @ApiValidationResponse()
  @ApiCreatedResponse({ type: ResetPasswordResponseDto })
  async resetPassword(@Body() body: ResetPasswordRequestDto) {
    return this.emailAuthService.requestPasswordReset(body.email);
  }

  @Post('new-password')
  @ApiOperation({ summary: 'New password' })
  @ApiBody({ type: NewPasswordRequestDto })
  @ApiValidationResponse()
  @ApiCreatedResponse({ type: NewPasswordResponseDto })
  async newPassword(@Body() body: NewPasswordRequestDto) {
    return this.emailAuthService.resetPassword(body.token, body.password);
  }
}
