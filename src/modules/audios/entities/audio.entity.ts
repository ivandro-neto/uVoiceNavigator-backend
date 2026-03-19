import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AudioEntity {
  @ApiProperty() id: string;
  @ApiProperty() filename: string;
  @ApiProperty({ enum: ['GO_CONTACT', 'FIVE9'] }) source: string;
  @ApiProperty() agentName: string;
  @ApiProperty() customerPhone: string;
  @ApiProperty({ description: 'Duration in seconds' }) duration: number;
  @ApiPropertyOptional() processedAt: Date | null;
  @ApiProperty() uploadedAt: Date;
  @ApiProperty() wasabiUrl: string;
  @ApiProperty({ enum: ['processed', 'pending', 'error'] }) status: string;
  @ApiProperty({ description: 'File size in bytes' }) fileSize: number;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
}
