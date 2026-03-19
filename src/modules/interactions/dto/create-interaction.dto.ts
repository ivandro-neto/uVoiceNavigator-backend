import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateInteractionDto {
  @ApiProperty({ description: 'Record type', enum: ['inbound', 'outbound'] })
  @IsIn(['inbound', 'outbound'])
  @IsNotEmpty()
  recordType: string;

  @ApiProperty({ description: 'Call ID', example: 'CALL-20260316-001' })
  @IsString()
  @IsNotEmpty()
  callId: string;

  @ApiProperty({ description: 'Call date (ISO 8601)', example: '2026-03-16T10:30:00Z' })
  @IsDateString()
  @IsNotEmpty()
  date: string;

  @ApiProperty({ description: 'Agent name', example: 'Maria Santos' })
  @IsString()
  @IsNotEmpty()
  agentName: string;

  @ApiProperty({ description: 'Agent ID', example: 'AGT-001' })
  @IsString()
  @IsNotEmpty()
  agentId: string;

  @ApiProperty({ description: 'Campaign name', example: 'BCB Recovery Q1 2026' })
  @IsString()
  @IsNotEmpty()
  campaign: string;

  @ApiProperty({ description: 'Campaign type', example: 'Recovery' })
  @IsString()
  @IsNotEmpty()
  campaignType: string;

  @ApiProperty({ description: 'Skill queue', example: 'Collections' })
  @IsString()
  @IsNotEmpty()
  skill: string;

  @ApiProperty({ description: 'Customer name', example: 'João Silva' })
  @IsString()
  @IsNotEmpty()
  customerName: string;

  @ApiPropertyOptional({ description: 'Customer email' })
  @IsOptional()
  @IsString()
  customerEmail?: string = '';

  @ApiProperty({ description: 'Customer phone', example: '+5511999999999' })
  @IsString()
  @IsNotEmpty()
  customerPhone: string;

  @ApiPropertyOptional({ description: 'Automatic Number Identification' })
  @IsOptional()
  @IsString()
  ani?: string = '';

  @ApiPropertyOptional({ description: 'Dialed Number Identification Service' })
  @IsOptional()
  @IsString()
  dnis?: string = '';

  @ApiPropertyOptional({ description: 'Customer segment' })
  @IsOptional()
  @IsString()
  segment?: string = '';

  @ApiPropertyOptional({ description: 'Dialing list name' })
  @IsOptional()
  @IsString()
  list?: string = '';

  @ApiPropertyOptional({ description: 'Contact ID' })
  @IsOptional()
  @IsString()
  contactId?: string = '';

  @ApiProperty({ description: 'Talk time in seconds', minimum: 0 })
  @IsInt()
  @Min(0)
  talkTime: number;

  @ApiProperty({ description: 'Handle time in seconds', minimum: 0 })
  @IsInt()
  @Min(0)
  handleTime: number;

  @ApiPropertyOptional({ description: 'Hold time in seconds', minimum: 0, default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  holdTime?: number = 0;

  @ApiPropertyOptional({ description: 'IVR time in seconds', minimum: 0, default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  ivrTime?: number = 0;

  @ApiPropertyOptional({ description: 'Wait time in seconds', minimum: 0, default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  waitTime?: number = 0;

  @ApiPropertyOptional({ description: 'Wrap time in seconds', minimum: 0, default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  wrapTime?: number = 0;

  @ApiProperty({ description: 'Disposition/outcome', example: 'PROMESSA_PAGAMENTO' })
  @IsString()
  @IsNotEmpty()
  disposition: string;

  @ApiPropertyOptional({ description: 'Disposition group A' })
  @IsOptional()
  @IsString()
  dispositionGroupA?: string = '';

  @ApiPropertyOptional({ description: 'Disposition group B' })
  @IsOptional()
  @IsString()
  dispositionGroupB?: string = '';

  @ApiPropertyOptional({ description: 'Disposition group C' })
  @IsOptional()
  @IsString()
  dispositionGroupC?: string = '';

  @ApiPropertyOptional({ description: 'Dial result', example: 'ANSWERED' })
  @IsOptional()
  @IsString()
  dialResult?: string = '';

  @ApiPropertyOptional({ description: 'Whether call was abandoned', default: false })
  @IsOptional()
  @IsBoolean()
  abandoned?: boolean = false;

  @ApiPropertyOptional({ description: 'Number of call attempts', minimum: 0, default: 1 })
  @IsOptional()
  @IsInt()
  @Min(0)
  callCount?: number = 1;

  @ApiPropertyOptional({ description: 'Number of suspensions', minimum: 0, default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  suspensionCount?: number = 0;

  @ApiPropertyOptional({ description: 'IVR contact identifier' })
  @IsOptional()
  @IsString()
  ivrContact?: string = '';

  @ApiPropertyOptional({ description: 'IVR NIF (Tax ID)' })
  @IsOptional()
  @IsString()
  ivrNif?: string = '';

  @ApiPropertyOptional({ description: 'IVR account number' })
  @IsOptional()
  @IsString()
  ivrAccountNumber?: string = '';

  @ApiProperty({ description: 'Business month (1-12)', minimum: 1, maximum: 12 })
  @IsInt()
  @Min(1)
  businessMonth: number;

  @ApiProperty({ description: 'Business day of week (0=Sunday, 6=Saturday)', minimum: 0, maximum: 6 })
  @IsInt()
  @Min(0)
  businessDayOfWeek: number;

  @ApiProperty({ description: 'Business day of month (1-31)', minimum: 1, maximum: 31 })
  @IsInt()
  @Min(1)
  businessDayOfMonth: number;

  @ApiProperty({ description: 'Business hour (0-23)', minimum: 0, maximum: 23 })
  @IsInt()
  @Min(0)
  businessHour: number;

  @ApiPropertyOptional({ description: 'Whether call was evaluated', default: false })
  @IsOptional()
  @IsBoolean()
  evaluated?: boolean = false;

  @ApiPropertyOptional({ description: 'Processing status', enum: ['processed', 'pending', 'error'], default: 'pending' })
  @IsOptional()
  @IsIn(['processed', 'pending', 'error'])
  status?: string = 'pending';
}
