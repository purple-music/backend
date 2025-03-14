import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { TimeSlotsService } from './time-slots.service';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import {
  TimeSlotDto,
  TimeSlotFilterDto,
  TimeSlotsDto,
} from './dtos/time-slots';
import { ApiJwtUnauthorizedResponse } from '../common/api-jwt-unauthorized-response.decorator';
import { ApiValidationResponse } from '../common/api-validation-response.decorator';

@ApiTags('TimeSlots')
@Controller('time-slots')
export class TimeSlotsController {
  constructor(private timeSlotsService: TimeSlotsService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  @ApiOperation({ summary: 'Get all time slots' })
  @ApiOkResponse({
    description: 'List of all time slots',
    type: TimeSlotsDto,
  })
  @ApiValidationResponse() // 400
  @ApiJwtUnauthorizedResponse() // 401
  async getTimeSlots(@Query() filter: TimeSlotFilterDto) {
    return await this.timeSlotsService.getTimeSlots(filter);
  }

  @UseGuards(JwtAuthGuard)
  @Get('user/:userId')
  @ApiOperation({ summary: 'Get time slots by user ID' })
  @ApiOkResponse({
    description: 'List of time slots for the specified user',
    type: [TimeSlotDto],
  })
  @ApiJwtUnauthorizedResponse()
  async getTimeSlotsByUserId(@Param('userId') userId: string) {
    return await this.timeSlotsService.getTimeSlotsByUserId(userId);
  }

  // @UseGuards(JwtAuthGuard)
  // @Get('user/:userId/transformed')
  // @ApiOperation({ summary: 'Get transformed bookings by user ID' })
  // @ApiOkResponse({ description: 'Transformed bookings grouped by day' })
  // async getTransformedBookingsByUserId(@Param('userId') userId: string) {
  //   return await this.timeSlotsService.getTransformedBookingsByUserId(userId);
  // }
  //
  // @UseGuards(JwtAuthGuard)
  // @Get('user/:userId/current')
  // @ApiOperation({ summary: 'Get current bookings by user ID' })
  // @ApiOkResponse({
  //   description: 'List of current bookings for the specified user',
  // })
  // async getCurrentBookingsByUserId(@Param('userId') userId: string) {
  //   return await this.timeSlotsService.getCurrentBookingsByUserId(userId);
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
  //   return await this.timeSlotsService.getAvailableSlots(from, to);
  // }
}
