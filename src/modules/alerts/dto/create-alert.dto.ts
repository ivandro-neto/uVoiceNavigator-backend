import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateAlertDto {
  @ApiProperty({
    description: 'Recipient email address',
    example: 'manager@uvoice.com',
  })
  @IsEmail()
  @IsNotEmpty()
  recipientEmail: string;

  @ApiProperty({
    description: 'Cron expression defining when to send the alert',
    example: '0 8 * * 1-5',
  })
  @IsString()
  @IsNotEmpty()
  schedule: string;

  @ApiPropertyOptional({
    description: 'Whether alert is enabled',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean = true;
}
