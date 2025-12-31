import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Request } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import { PublicCardService } from './public-card.service';
import { AnalyticsEventType } from '@prisma/client';

@ApiTags('Public Cards')
@Controller('public/cards')
@Public()
export class PublicCardController {
  constructor(private readonly publicCardService: PublicCardService) {}

  @Get(':slug')
  @ApiOperation({ summary: 'Get public card by slug' })
  @ApiResponse({ status: 200, description: 'Card details' })
  @ApiResponse({ status: 404, description: 'Card not found' })
  async getCard(@Param('slug') slug: string, @Req() req: Request) {
    return this.publicCardService.getCardBySlug(slug, req);
  }

  @Post(':slug/track')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Track card interaction' })
  @ApiResponse({ status: 200, description: 'Event tracked' })
  async trackEvent(
    @Param('slug') slug: string,
    @Body('eventType') eventType: AnalyticsEventType,
    @Body('metadata') metadata: Record<string, unknown>,
    @Req() req: Request,
  ) {
    return this.publicCardService.trackEvent(slug, eventType, metadata, req);
  }

  @Get(':slug/vcard')
  @ApiOperation({ summary: 'Download vCard file' })
  @ApiResponse({ status: 200, description: 'vCard file' })
  @ApiResponse({ status: 404, description: 'Card not found' })
  async downloadVCard(@Param('slug') slug: string, @Req() req: Request) {
    return this.publicCardService.generateVCard(slug, req);
  }
}
