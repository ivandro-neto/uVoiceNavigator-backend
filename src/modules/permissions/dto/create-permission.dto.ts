import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsString } from 'class-validator';

export class CreatePermissionDto {
  @ApiProperty({
    description: 'Resource this permission applies to',
    example: 'interactions',
    enum: ['interactions', 'audios', 'alerts', 'dashboard', 'users', 'roles', 'permissions'],
  })
  @IsString()
  @IsNotEmpty()
  @IsIn(['interactions', 'audios', 'alerts', 'dashboard', 'users', 'roles', 'permissions'])
  resource: string;

  @ApiProperty({
    description: 'Action allowed',
    example: 'read',
    enum: ['read', 'write', 'delete', 'manage'],
  })
  @IsString()
  @IsNotEmpty()
  @IsIn(['read', 'write', 'delete', 'manage'])
  action: string;
}
