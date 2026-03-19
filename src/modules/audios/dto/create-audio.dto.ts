import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateAudioDto {
  @ApiProperty({ description: 'Audio filename', example: 'CALL-20260316-001.mp3' })
  @IsString()
  @IsNotEmpty()
  filename: string;

  @ApiProperty({ description: 'Audio source system', enum: ['GO_CONTACT', 'FIVE9'] })
  @IsIn(['GO_CONTACT', 'FIVE9'])
  @IsNotEmpty()
  source: string;

  @ApiProperty({ description: 'Agent name', example: 'Maria Santos' })
  @IsString()
  @IsNotEmpty()
  agentName: string;

  @ApiProperty({ description: 'Customer phone number', example: '+5511999999999' })
  @IsString()
  @IsNotEmpty()
  customerPhone: string;

  @ApiProperty({ description: 'Audio duration in seconds', minimum: 0 })
  @IsInt()
  @Min(0)
  duration: number;

  @ApiProperty({ description: 'Wasabi S3 URL to audio file', example: 'https://s3.wasabisys.com/bucket/file.mp3' })
  @IsString()
  @IsNotEmpty()
  wasabiUrl: string;

  @ApiProperty({ description: 'File size in bytes', minimum: 0 })
  @IsInt()
  @Min(0)
  fileSize: number;

  @ApiPropertyOptional({ description: 'Processing status', enum: ['processed', 'pending', 'error'], default: 'pending' })
  @IsOptional()
  @IsIn(['processed', 'pending', 'error'])
  status?: string = 'pending';
}
