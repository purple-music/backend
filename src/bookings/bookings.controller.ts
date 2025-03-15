import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { BookingsService } from './bookings.service';
import { ApiBody, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { MakeBookingDto, BookingDto } from './dtos/make-booking.dto';
import { UsersService } from '../users/users.service';
import { ApiJwtUnauthorizedResponse } from '../common/api-jwt-unauthorized-response.decorator';
import { ApiValidationResponse } from '../common/api-validation-response.decorator';
import { GetPricesDto, PricesResponseDto } from './dtos/get-prices.dto';

@ApiTags('Bookings')
@Controller('bookings')
export class BookingsController {
  constructor(
    private bookingsService: BookingsService,
    private usersService: UsersService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBody({ type: MakeBookingDto })
  @ApiResponse({
    status: 201,
    description: 'Booking created successfully.',
    type: BookingDto,
  })
  @ApiValidationResponse()
  @ApiJwtUnauthorizedResponse()
  async makeBooking(@Body() data: MakeBookingDto, @Req() req: Request) {
    if (!req.user || !req.user.email) {
      throw new UnauthorizedException('Invalid Credentials');
    }
    const user = await this.usersService.findByEmail(req.user.email);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return await this.bookingsService.makeBooking(data, user);
  }

  @Get('/prices')
  @UseGuards(JwtAuthGuard)
  @ApiBody({ type: GetPricesDto })
  @ApiResponse({
    status: 200,
    description: 'Booking created successfully.',
    type: [PricesResponseDto],
  })
  @ApiValidationResponse()
  @ApiJwtUnauthorizedResponse()
  async getPrices(@Body() data: GetPricesDto) {
    return await this.bookingsService.getPrices(data);
  }
}
