import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AlertEntity {
  @ApiProperty() id: string;
  @ApiProperty() recipientEmail: string;
  @ApiProperty({ description: 'Cron expression', example: '0 8 * * 1-5' }) schedule: string;
  @ApiProperty() enabled: boolean;
  @ApiPropertyOptional() lastSent: Date | null;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
}
