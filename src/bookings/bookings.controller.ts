import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { BookingsService } from './bookings.service';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { BookingDto, BookingFilterDto, BookingsResponse } from './dto/bookings';
import { ApiJwtUnauthorizedResponse } from '../common/api-jwt-unauthorized-response.decorator';
import { ApiValidationResponse } from '../common/api-validation-response.decorator';

@ApiTags('Bookings')
@Controller('bookings')
export class BookingsController {
  constructor(private bookingsService: BookingsService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  @ApiOperation({ summary: 'Get all bookings' })
  @ApiOkResponse({
    description: 'List of all bookings',
    type: BookingsResponse,
  })
  @ApiValidationResponse() // 400
  @ApiJwtUnauthorizedResponse() // 401
  async getBookings(@Query() filter: BookingFilterDto) {
    return await this.bookingsService.getBookings(filter);
  }

  @UseGuards(JwtAuthGuard)
  @Get('user/:userId')
  @ApiOperation({ summary: 'Get bookings by user ID' })
  @ApiOkResponse({
    description: 'List of bookings for the specified user',
    type: [BookingDto],
  })
  @ApiJwtUnauthorizedResponse()
  async getBookingsByUserId(@Param('userId') userId: string) {
    return await this.bookingsService.getBookingsByUserId(userId);
  }

  // @UseGuards(JwtAuthGuard)
  // @Get('user/:userId/transformed')
  // @ApiOperation({ summary: 'Get transformed bookings by user ID' })
  // @ApiOkResponse({ description: 'Transformed bookings grouped by day' })
  // async getTransformedBookingsByUserId(@Param('userId') userId: string) {
  //   return await this.bookingsService.getTransformedBookingsByUserId(userId);
  // }
  //
  // @UseGuards(JwtAuthGuard)
  // @Get('user/:userId/current')
  // @ApiOperation({ summary: 'Get current bookings by user ID' })
  // @ApiOkResponse({
  //   description: 'List of current bookings for the specified user',
  // })
  // async getCurrentBookingsByUserId(@Param('userId') userId: string) {
  //   return await this.bookingsService.getCurrentBookingsByUserId(userId);
  // }
  //
  // @UseGuards(JwtAuthGuard)
  // @Get('available-slots')
  // @ApiOperation({ summary: 'Get available slots' })
  // @ApiQuery({ name: 'from', type: 'string', required: true })
  // @ApiQuery({ name: 'to', type: 'string', required: true })
  // @ApiOkResponse({ description: 'List of available slots' })
  // @ApiBadRequestResponse({ description: 'Invalid input data' })
  // async getAvailableSlots(
  //   @Query('from') from: string,
  //   @Query('to') to: string,
  // ) {
  //   return await this.bookingsService.getAvailableSlots(from, to);
  // }
}
