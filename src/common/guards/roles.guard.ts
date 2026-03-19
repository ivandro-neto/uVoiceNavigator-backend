import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY, ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no roles or permissions required, allow access
    if (!requiredRoles && !requiredPermissions) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user) {
      throw new ForbiddenException('Access denied: no user context');
    }

    // Check roles
    if (requiredRoles && requiredRoles.length > 0) {
      const userRoles: string[] = user.roles?.map((r: any) => r.name) || [];
      const hasRole = requiredRoles.some((role) => userRoles.includes(role));

      if (!hasRole) {
        throw new ForbiddenException(
          `Access denied: requires one of these roles: ${requiredRoles.join(', ')}`,
        );
      }
    }

    // Check permissions
    if (requiredPermissions && requiredPermissions.length > 0) {
      const userPermissions: string[] = [];

      if (user.roles) {
        for (const role of user.roles) {
          if (role.permissions) {
            for (const perm of role.permissions) {
              const permName = perm.permission?.name || perm.name;
              if (permName) {
                userPermissions.push(permName);
              }
            }
          }
        }
      }

      const hasPermission = requiredPermissions.every((perm) => userPermissions.includes(perm));

      if (!hasPermission) {
        throw new ForbiddenException(
          `Access denied: requires permissions: ${requiredPermissions.join(', ')}`,
        );
      }
    }

    return true;
  }
}
