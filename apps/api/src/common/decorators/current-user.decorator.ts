import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Decorador de parámetro para inyectar el usuario autenticado desde la request
 * Ejemplo: @CurrentUser() user: AuthenticatedUser
 */
export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    return data ? user?.[data] : user;
  },
);
