import { ApiProperty } from '@nestjs/swagger';

export class PermissionEntity {
  @ApiProperty({ description: 'Permission unique identifier' })
  id: string;

  @ApiProperty({ description: 'Permission name in format resource:action', example: 'interactions:read' })
  name: string;

  @ApiProperty({ description: 'Resource this permission applies to', example: 'interactions' })
  resource: string;

  @ApiProperty({ description: 'Action allowed', example: 'read' })
  action: string;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;
}
