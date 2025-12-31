import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString, ArrayMaxSize } from 'class-validator';

export class UpdateLockedFieldsDto {
  @ApiProperty({
    description: 'List of field names to lock for employees',
    example: ['firstName', 'lastName', 'jobTitle', 'primaryColor'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(50, { message: 'Cannot lock more than 50 fields' })
  lockedFields: string[];
}

export const LOCKABLE_CARD_FIELDS = [
  'firstName',
  'lastName',
  'jobTitle',
  'bio',
  'profilePhoto',
  'coverImage',
  'addressStreet',
  'addressCity',
  'addressState',
  'addressZipCode',
  'addressCountry',
  'primaryColor',
  'backgroundColor',
  'fontFamily',
] as const;

export type LockableCardField = (typeof LOCKABLE_CARD_FIELDS)[number];
