import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AccessTokenGuard } from '../auth/core/tokens/access-token.guard';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { FreeSlotsFilterDto, FreeSlotsResponseDto } from './dtos/free-slots';
import { ApiValidationResponse } from '../common/api-validation-response.decorator';
import { ApiJwtUnauthorizedResponse } from '../common/api-jwt-unauthorized-response.decorator';
import { FreeSlotsService } from './free-slots.service';

@ApiTags('FreeSlots')
@Controller('free-slots')
export class FreeSlotsController {
  constructor(private readonly freeSlotsService: FreeSlotsService) {}

  // TODO: should add working hours to each studio in DB and filter in the service method
  @Get()
  @UseGuards(AccessTokenGuard)
  @ApiResponse({
    status: 200,
    description: 'Successfully fetched free slots',
    type: FreeSlotsResponseDto,
  })
  @ApiValidationResponse()
  @ApiJwtUnauthorizedResponse()
  async getFreeSlots(
    @Query() filter: FreeSlotsFilterDto,
  ): Promise<FreeSlotsResponseDto> {
    return this.freeSlotsService.getFreeSlots(filter);
  }
}
