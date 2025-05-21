import {
  Controller,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
  Get,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { SessionService } from './session.service';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';
import { JwtRefreshAuthGuard } from '../../common/jwt-refresh-auth.guard';
import { UsersService } from '../../users/users.service';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UnauthorizedResponseDto } from '../../common/dtos/unauthorized-response.dto';
import { JwtTokensService } from '../core/tokens/jwt-tokens.service';
import { LogoutResponseDto } from './dtos/logout-response.dto';
import { ProfileResponseDto } from './dtos/profile-response.dto';
import { RefreshResponseDto } from './dtos/refresh-response.dto';

@ApiTags('Session Management')
@Controller('auth')
export class SessionController {
  constructor(
    private sessionService: SessionService,
    private tokenService: JwtTokensService,
    private userService: UsersService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @ApiOkResponse({ type: LogoutResponseDto })
  logout(@Req() req: Request, @Res() res: Response) {
    this.tokenService.removeTokensFromCookies(res);

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
    if (!req.user || !req.user.id) {
      throw new UnauthorizedException('Invalid Credentials');
    }
    const user = await this.userService.findById(req.user.id);
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

  @UseGuards(JwtRefreshAuthGuard)
  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiCreatedResponse({ type: RefreshResponseDto })
  async refresh(@Req() req: Request, @Res() res: Response) {
    const refreshToken = req.cookies['refresh_token'] as string;
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token missing');
    }

    const { newAccessToken, newRefreshToken } =
      await this.sessionService.refreshTokens(refreshToken);
    this.tokenService.addTokensToCookies(res, newAccessToken, newRefreshToken);

    return res.json({
      message: 'Tokens refreshed successfully',
    });
  }
}
