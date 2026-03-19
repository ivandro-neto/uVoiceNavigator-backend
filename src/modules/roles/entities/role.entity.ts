import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RoleEntity {
  @ApiProperty({ description: 'Role unique identifier' })
  id: string;

  @ApiProperty({ description: 'Role name', example: 'admin' })
  name: string;

  @ApiPropertyOptional({ description: 'Role description' })
  description: string | null;

  @ApiProperty({ description: 'Associated permissions' })
  permissions: any[];

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;
}
