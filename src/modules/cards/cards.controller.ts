import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CardsService } from './cards.service';
import { CreateCardDto, UpdateCardDto, CardQueryDto } from './dto';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { ParseUUIDPipe } from '../../common/pipes/parse-uuid.pipe';
import { ApiPaginatedResponse } from '../../common/decorators/api-paginated-response.decorator';

@ApiTags('Cards')
@Controller('cards')
@ApiBearerAuth()
export class CardsController {
  constructor(private readonly cardsService: CardsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new card' })
  @ApiResponse({ status: 201, description: 'Card created' })
  @ApiResponse({ status: 403, description: 'Card limit reached' })
  async create(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateCardDto,
  ) {
    return this.cardsService.create(user, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all user cards' })
  @ApiPaginatedResponse(Object)
  async findAll(
    @CurrentUser() user: CurrentUserPayload,
    @Query() query: CardQueryDto,
  ) {
    return this.cardsService.findAll(user, query);
  }

  @Get('check-slug/:slug')
  @ApiOperation({ summary: 'Check if slug is available' })
  @ApiResponse({ status: 200, description: 'Slug availability' })
  async checkSlug(@Param('slug') slug: string) {
    return this.cardsService.checkSlugAvailability(slug);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a card by ID' })
  @ApiResponse({ status: 200, description: 'Card details' })
  @ApiResponse({ status: 404, description: 'Card not found' })
  async findOne(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.cardsService.findOne(user, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a card' })
  @ApiResponse({ status: 200, description: 'Card updated' })
  @ApiResponse({ status: 404, description: 'Card not found' })
  async update(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCardDto,
  ) {
    return this.cardsService.update(user, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a card' })
  @ApiResponse({ status: 200, description: 'Card deleted' })
  @ApiResponse({ status: 404, description: 'Card not found' })
  async remove(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.cardsService.remove(user, id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Activate/deactivate a card' })
  @ApiResponse({ status: 200, description: 'Status updated' })
  async updateStatus(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body('isActive') isActive: boolean,
  ) {
    return this.cardsService.updateStatus(user, id, isActive);
  }

  @Get(':id/history')
  @ApiOperation({ summary: 'Get card change history' })
  @ApiResponse({ status: 200, description: 'Card history' })
  async getHistory(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.cardsService.getHistory(user, id);
  }
}
