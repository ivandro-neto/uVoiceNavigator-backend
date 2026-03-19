import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsOptional, IsString } from 'class-validator';

export class UpdateAlertDto {
  @ApiPropertyOptional({ description: 'Recipient email address' })
  @IsOptional()
  @IsEmail()
  recipientEmail?: string;

  @ApiPropertyOptional({ description: 'Cron expression for schedule', example: '0 9 * * 1-5' })
  @IsOptional()
  @IsString()
  schedule?: string;

  @ApiPropertyOptional({ description: 'Whether alert is enabled' })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}
