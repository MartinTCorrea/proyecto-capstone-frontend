import { SetMetadata } from '@nestjs/common';
import { RoleName } from '@prisma/client';

export const ROLES_KEY = 'roles';

/**
 * Decorador para restringir el acceso a uno o más roles de negocio (RF02, Anexo A.1)
 * Ejemplo: @Roles(RoleName.ADMIN_COMISION_TECNICA, RoleName.ARBITRO)
 */
export const Roles = (...roles: RoleName[]) => SetMetadata(ROLES_KEY, roles);
