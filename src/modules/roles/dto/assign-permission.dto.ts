import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class AssignPermissionDto {
  @ApiProperty({ description: 'Permission ID to assign to the role', example: 'permission-uuid' })
  @IsUUID()
  @IsNotEmpty()
  permissionId: string;
}
