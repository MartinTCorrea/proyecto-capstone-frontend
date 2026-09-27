import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RoleName, UserStatus } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<RoleName[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Si el endpoint no especifica roles requeridos, se permite el acceso al usuario autenticado
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user) {
      throw new ForbiddenException('Acceso denegado: Usuario no autenticado en el contexto de seguridad.');
    }

    // Validación dura de estado: usuario inactivo no puede operar en el sistema
    if (user.status === UserStatus.INACTIVE) {
      throw new ForbiddenException('Acceso denegado: Su cuenta de usuario se encuentra deshabilitada o inactiva.');
    }

    // Si el usuario aún no tiene roles asignados
    if (!user.roles || user.roles.length === 0) {
      throw new ForbiddenException(
        'Acceso denegado: Su cuenta se encuentra en estado PENDING_ROLE. La Comisión Técnica debe asignarle un rol técnico previamente.',
      );
    }

    // El Administrador de Comisión Técnica tiene acceso jerárquico global
    if (user.roles.includes(RoleName.ADMIN_COMISION_TECNICA)) {
      return true;
    }

    // Comprobar si el usuario posee al menos uno de los roles requeridos
    const hasRequiredRole = requiredRoles.some((role) => user.roles.includes(role));

    if (!hasRequiredRole) {
      throw new ForbiddenException(
        `Acceso denegado: Permisos insuficientes. Se requiere uno de los siguientes roles: [${requiredRoles.join(', ')}]. Sus roles actuales son: [${user.roles.join(', ')}].`,
      );
    }

    return true;
  }
}
