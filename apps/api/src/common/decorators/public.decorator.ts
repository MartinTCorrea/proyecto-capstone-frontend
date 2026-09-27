import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Decorador para marcar endpoints que no requieren token JWT (ej. health check, webhooks externos)
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
