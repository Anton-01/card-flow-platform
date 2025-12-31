import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  ValidateNested,
  IsEnum,
  IsInt,
  Min,
  Matches,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { PhoneType, EmailType } from '@prisma/client';

export class CreateCardPhoneDto {
  @ApiProperty({ enum: PhoneType, default: PhoneType.MOBILE })
  @IsEnum(PhoneType)
  type: PhoneType = PhoneType.MOBILE;

  @ApiProperty({ description: 'Phone number', example: '+52 55 1234 5678' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  number: string;

  @ApiPropertyOptional({ description: 'Custom label', example: 'Office' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  label?: string;

  @ApiPropertyOptional({ description: 'Display order', default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}

export class CreateCardEmailDto {
  @ApiProperty({ enum: EmailType, default: EmailType.WORK })
  @IsEnum(EmailType)
  type: EmailType = EmailType.WORK;

  @ApiProperty({ description: 'Email address', example: 'john@company.com' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  email: string;

  @ApiPropertyOptional({ description: 'Custom label' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  label?: string;

  @ApiPropertyOptional({ description: 'Display order', default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}

export class CreateCardSocialLinkDto {
  @ApiProperty({ description: 'Platform name', example: 'linkedin' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  platform: string;

  @ApiProperty({ description: 'Profile URL', example: 'https://linkedin.com/in/johndoe' })
  @IsUrl()
  url: string;

  @ApiPropertyOptional({ description: 'Display name' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  displayName?: string;

  @ApiPropertyOptional({ description: 'Display order', default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}

export class CreateCardCustomLinkDto {
  @ApiProperty({ description: 'Link title', example: 'Portfolio' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  title: string;

  @ApiProperty({ description: 'Link URL', example: 'https://portfolio.johndoe.com' })
  @IsUrl()
  url: string;

  @ApiPropertyOptional({ description: 'Icon name or URL' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  icon?: string;

  @ApiPropertyOptional({ description: 'Display order', default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}

export class CreateCardDto {
  @ApiProperty({ description: 'First name', example: 'John' })
  @IsString()
  @IsNotEmpty({ message: 'First name is required' })
  @MaxLength(100)
  @Transform(({ value }: { value: string }) => value?.trim())
  firstName: string;

  @ApiProperty({ description: 'Last name', example: 'Doe' })
  @IsString()
  @IsNotEmpty({ message: 'Last name is required' })
  @MaxLength(100)
  @Transform(({ value }: { value: string }) => value?.trim())
  lastName: string;

  @ApiPropertyOptional({ description: 'Job title', example: 'Software Engineer' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  jobTitle?: string;

  @ApiPropertyOptional({ description: 'Bio or description' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  bio?: string;

  @ApiPropertyOptional({ description: 'Profile photo URL' })
  @IsOptional()
  @IsUrl()
  profilePhoto?: string;

  @ApiPropertyOptional({ description: 'Cover image URL' })
  @IsOptional()
  @IsUrl()
  coverImage?: string;

  @ApiPropertyOptional({ description: 'Street address' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  addressStreet?: string;

  @ApiPropertyOptional({ description: 'City' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  addressCity?: string;

  @ApiPropertyOptional({ description: 'State/Province' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  addressState?: string;

  @ApiPropertyOptional({ description: 'ZIP/Postal code' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  addressZipCode?: string;

  @ApiPropertyOptional({ description: 'Country' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  addressCountry?: string;

  @ApiPropertyOptional({ description: 'Primary color (hex)', example: '#0ea5e9' })
  @IsOptional()
  @IsString()
  @Matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, { message: 'Invalid hex color' })
  primaryColor?: string;

  @ApiPropertyOptional({ description: 'Background color (hex)' })
  @IsOptional()
  @IsString()
  @Matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, { message: 'Invalid hex color' })
  backgroundColor?: string;

  @ApiPropertyOptional({ description: 'Font family' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  fontFamily?: string;

  @ApiPropertyOptional({ description: 'Phone numbers', type: [CreateCardPhoneDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateCardPhoneDto)
  phones?: CreateCardPhoneDto[];

  @ApiPropertyOptional({ description: 'Email addresses', type: [CreateCardEmailDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateCardEmailDto)
  emails?: CreateCardEmailDto[];

  @ApiPropertyOptional({ description: 'Social links', type: [CreateCardSocialLinkDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateCardSocialLinkDto)
  socialLinks?: CreateCardSocialLinkDto[];

  @ApiPropertyOptional({ description: 'Custom links', type: [CreateCardCustomLinkDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateCardCustomLinkDto)
  customLinks?: CreateCardCustomLinkDto[];
}
