import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length } from 'class-validator';

export class Verify2FADto {
  @ApiProperty({
    description: '6-digit verification code',
    example: '123456',
  })
  @IsString()
  @IsNotEmpty({ message: 'Verification code is required' })
  @Length(6, 6, { message: 'Verification code must be exactly 6 digits' })
  code: string;

  @ApiProperty({
    description: 'Temporary token received after login',
    example: 'temp_token_here',
  })
  @IsString()
  @IsNotEmpty({ message: 'Temporary token is required' })
  tempToken: string;
}

export class Request2FACodeDto {
  @ApiProperty({
    description: 'Temporary token received after login',
    example: 'temp_token_here',
  })
  @IsString()
  @IsNotEmpty({ message: 'Temporary token is required' })
  tempToken: string;
}
