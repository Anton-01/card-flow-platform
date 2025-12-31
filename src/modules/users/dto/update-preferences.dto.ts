import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, IsIn } from 'class-validator';

export class UpdatePreferencesDto {
  @ApiPropertyOptional({
    description: 'User timezone',
    example: 'America/Mexico_City',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  timezone?: string;

  @ApiPropertyOptional({
    description: 'User preferred language',
    example: 'es',
    enum: ['es', 'en'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['es', 'en'], { message: 'Language must be "es" or "en"' })
  language?: string;
}
