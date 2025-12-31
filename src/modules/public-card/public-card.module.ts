import { Module } from '@nestjs/common';
import { PublicCardController } from './public-card.controller';
import { PublicCardService } from './public-card.service';

@Module({
  controllers: [PublicCardController],
  providers: [PublicCardService],
})
export class PublicCardModule {}
