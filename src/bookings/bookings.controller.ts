import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
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
import { GetPricesDto, PricesStudioResponseDto } from './dtos/get-prices.dto';

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
    description: 'Successfully made a booking',
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

    return await this.bookingsService.makeBooking(data, user.id);
  }

  @Get('/prices/:studioId')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({
    status: 200,
    description: 'Successfully fetched prices',
    type: PricesStudioResponseDto,
  })
  @ApiValidationResponse()
  @ApiJwtUnauthorizedResponse()
  async getPrices(
    @Query() filter: GetPricesDto,
    @Param('studioId') studioId: string,
  ) {
    return await this.bookingsService.getPrices(filter, studioId);
  }

  @Get('/prices')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({
    status: 200,
    description: 'Prices for all studios',
    type: [PricesStudioResponseDto],
  })
  @ApiValidationResponse()
  @ApiJwtUnauthorizedResponse()
  async getAllPrices(@Query() filter: GetPricesDto) {
    return await this.bookingsService.getAllPrices(filter);
  }
}
