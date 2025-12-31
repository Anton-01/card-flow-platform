import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Matches,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateCompanyDto {
  @ApiProperty({
    description: 'Company name',
    example: 'Acme Corporation',
    maxLength: 200,
  })
  @IsString()
  @IsNotEmpty({ message: 'Company name is required' })
  @MaxLength(200, { message: 'Company name cannot exceed 200 characters' })
  @Transform(({ value }: { value: string }) => value?.trim())
  name: string;

  @ApiPropertyOptional({
    description: 'Industry sector',
    example: 'Technology',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  industry?: string;

  @ApiPropertyOptional({
    description: 'Company website URL',
    example: 'https://acme.com',
  })
  @IsOptional()
  @IsUrl({}, { message: 'Please provide a valid URL' })
  website?: string;

  @ApiPropertyOptional({
    description: 'Company description',
    example: 'Leading technology solutions provider',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;
}
