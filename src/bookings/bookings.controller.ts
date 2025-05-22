import {
  Body,
  Controller,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { BookingsService } from './bookings.service';
import { ApiBody, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AccessTokenGuard } from '../auth/core/tokens/access-token.guard';
import { MakeBookingDto, BookingDto } from './dtos/make-booking.dto';
import { UsersService } from '../users/users.service';
import { ApiJwtUnauthorizedResponse } from '../common/api-jwt-unauthorized-response.decorator';
import { ApiValidationResponse } from '../common/api-validation-response.decorator';

@ApiTags('Bookings')
@Controller('bookings')
export class BookingsController {
  constructor(
    private bookingsService: BookingsService,
    private usersService: UsersService,
  ) {}

  @Post()
  @UseGuards(AccessTokenGuard)
  @ApiBody({ type: MakeBookingDto })
  @ApiResponse({
    status: 201,
    description: 'Successfully made a booking',
    type: BookingDto,
  })
  @ApiValidationResponse()
  @ApiJwtUnauthorizedResponse()
  async makeBooking(@Body() data: MakeBookingDto, @Req() req: Request) {
    if (!req.user || !req.user.id) {
      throw new UnauthorizedException('Invalid Credentials');
    }
    const user = await this.usersService.findById(req.user.id);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return await this.bookingsService.makeBooking(data, user.id);
  }
}
