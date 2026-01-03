import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, IsUrl } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateUserDto {
  @ApiPropertyOptional({
    description: 'User first name',
    example: 'John',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'First name cannot exceed 100 characters' })
  @Transform(({ value }: { value: string }) => value?.trim())
  firstName?: string;

  @ApiPropertyOptional({
    description: 'User last name',
    example: 'Doe',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Last name cannot exceed 100 characters' })
  @Transform(({ value }: { value: string }) => value?.trim())
  lastName?: string;

  @ApiPropertyOptional({
    description: 'User phone number',
    example: '+52 55 1234 5678',
  })
  @IsOptional()
  @IsString()
  @MaxLength(20, { message: 'Phone number cannot exceed 20 characters' })
  phone?: string;

  @ApiPropertyOptional({
    description: 'User avatar URL',
    example: 'https://cdn.cardflow.com/avatars/user.jpg',
  })
  @IsOptional()
  @IsUrl({}, { message: 'Please provide a valid URL' })
  avatar?: string;
}
