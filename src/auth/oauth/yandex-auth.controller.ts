import {
  Controller,
  Get,
  HttpStatus,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import {
  ApiExcludeEndpoint,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtTokensService } from '../core/tokens/jwt-tokens.service';

@ApiTags('OAuth')
@Controller('auth')
export class YandexAuthController {
  constructor(
    private jwtTokenService: JwtTokensService,
    private config: ConfigService,
  ) {}

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
  @ApiExcludeEndpoint()
  async yandexAuthCallback(@Req() req: Request, @Res() res: Response) {
    if (!req.user || !req.user.email) {
      throw new UnauthorizedException('No email found');
    }

    const { accessToken, refreshToken } =
      await this.jwtTokenService.generateJwt({
        id: req.user.id,
        email: req.user.email,
      });

    const successUrl = this.config.get<string>('CLIENT_AUTH_SUCCESS_URL');
    if (!successUrl) {
      throw new Error('CLIENT_AUTH_SUCCESS_URL not configured');
    }

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
