import {
  Controller,
  Get,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import {
  ApiBody,
  ApiExcludeEndpoint,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtTokensService } from '../core/tokens/jwt-tokens.service';
import {
  LoginTelegramRequestDto,
  LoginTelegramResponseDto,
} from './dtos/login-telegram.dto';
import { ApiJwtUnauthorizedResponse } from '../../common/api-jwt-unauthorized-response.decorator';
import { UsersService } from '../../users/users.service';

@ApiTags('OAuth')
@Controller('auth')
export class TelegramAuthController {
  constructor(
    private jwtTokenService: JwtTokensService,
    private config: ConfigService,
    private userService: UsersService,
  ) {}

  @Post('login-telegram')
  @UseGuards(AuthGuard('telegram'))
  @ApiBody({ type: LoginTelegramRequestDto })
  @ApiJwtUnauthorizedResponse()
  @ApiOperation({ summary: 'Login with Telegram' })
  @ApiOkResponse({ type: LoginTelegramResponseDto })
  async loginTelegram(@Req() req: Request, @Res() res: Response) {
    console.log('Login endpoint hit'); // <-- Add this
    if (!req.user || !req.user.id) {
      console.log('No user in request'); // <-- Add this
      throw new UnauthorizedException('Could not find Telegram user');
    }

    console.log(`Looking for user ${req.user.id}`); // <-- Add this
    const user = await this.userService.findById(req.user.id);
    if (!user) {
      console.log('User not found in DB'); // <-- Add this
      throw new UnauthorizedException('Could not find Telegram user');
    }

    try {
      console.log('Creating session'); // <-- Add this
      const { accessToken, refreshToken } =
        await this.jwtTokenService.createLoginSession({
          id: user.id.toString(),
        });

      console.log('Adding tokens to cookies'); // <-- Add this
      this.jwtTokenService.addTokensToCookies(res, accessToken, refreshToken);

      return res.status(200).json({ message: 'Login successful' });
    } catch (error) {
      console.error('Error in login:', error); // <-- Add this
      if (error instanceof Error) {
        throw new UnauthorizedException(
          'Mini App authentication failed: ' + error.message,
        );
      }
    }
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
  async telegramAuthCallback(@Req() req: Request, @Res() res: Response) {
    if (!req.user) {
      throw new UnauthorizedException('Invalid Telegram credentials');
    }

    // Generate JWT (implement this in your auth service)
    const { accessToken, refreshToken } =
      await this.jwtTokenService.createLoginSession({
        id: req.user.id,
      });

    const successUrl = this.config.getOrThrow<string>(
      'CLIENT_AUTH_SUCCESS_URL',
    );

    // Redirect to frontend with tokens in URL hash
    const redirectUrl = new URL(successUrl);

    // Use hash to prevent server-side logging of tokens
    redirectUrl.hash = new URLSearchParams({
      access_token: accessToken,
      refresh_token: refreshToken,
    }).toString();

    return res.redirect(redirectUrl.toString());
  }
}
