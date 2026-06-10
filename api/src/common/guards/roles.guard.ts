import { CanActivate, ExecutionContext, ForbiddenException, Injectable, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { UserRole } from '@prisma/client';
import type { Request } from 'express';
import type { JwtPayload } from '../../modules/auth/types/jwt-payload.type';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]): MethodDecorator => SetMetadata(ROLES_KEY, roles);

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<UserRole[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) return true;

    const req = context.switchToHttp().getRequest<Request & { user?: JwtPayload }>();
    const user = req.user;
    if (!user) throw new ForbiddenException('İstifadəçi məlumatı yoxdur');
    if (!required.includes(user.role)) {
      throw new ForbiddenException('Bu əməliyyat üçün icazəniz yoxdur');
    }
    return true;
  }
}
