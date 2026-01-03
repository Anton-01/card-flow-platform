import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
} from 'class-validator';

export class UpdateBrandingDto {
  @ApiPropertyOptional({
    description: 'Company logo URL',
    example: 'https://cdn.cardflow.com/logos/acme.png',
  })
  @IsOptional()
  @IsUrl({}, { message: 'Please provide a valid URL' })
  logo?: string;

  @ApiPropertyOptional({
    description: 'Primary brand color (hex)',
    example: '#0ea5e9',
  })
  @IsOptional()
  @IsString()
  @Matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, {
    message: 'Please provide a valid hex color',
  })
  primaryColor?: string;

  @ApiPropertyOptional({
    description: 'Secondary brand color (hex)',
    example: '#1f2937',
  })
  @IsOptional()
  @IsString()
  @Matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, {
    message: 'Please provide a valid hex color',
  })
  secondaryColor?: string;

  @ApiPropertyOptional({
    description: 'Font family',
    example: 'Inter',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  fontFamily?: string;

  @ApiPropertyOptional({
    description: 'Cover image URL',
    example: 'https://cdn.cardflow.com/covers/acme-cover.jpg',
  })
  @IsOptional()
  @IsUrl({}, { message: 'Please provide a valid URL' })
  coverImage?: string;
}
