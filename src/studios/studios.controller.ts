import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { AccessTokenGuard } from '../auth/core/tokens/access-token.guard';
import { ApiJwtUnauthorizedResponse } from '../common/api-jwt-unauthorized-response.decorator';
import { StudiosService } from './studios.service';
import { StudiosResponseDto } from './dtos/studio.dto';

@ApiTags('Studios')
@Controller('studios')
export class StudiosController {
  constructor(private readonly studiosService: StudiosService) {}

  @Get()
  @UseGuards(AccessTokenGuard)
  @ApiResponse({
    status: 200,
    description: 'Returns all studios',
    type: StudiosResponseDto,
  })
  @ApiJwtUnauthorizedResponse()
  async getStudios(): Promise<StudiosResponseDto> {
    return this.studiosService.getStudios();
  }
}
