import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { RoleName, UserStatus } from '@prisma/client';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  const createMockContext = (user?: any): ExecutionContext => {
    return {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    } as unknown as ExecutionContext;
  };

  it('should allow access if no roles are required on endpoint', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

    const context = createMockContext({ roles: [RoleName.ARBITRO] });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow access if user has required role', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([RoleName.ARBITRO]);

    const context = createMockContext({
      status: UserStatus.ACTIVE,
      roles: [RoleName.ARBITRO],
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow access to ADMIN_COMISION_TECNICA hierarchically for any role', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([RoleName.ARBITRO]);

    const context = createMockContext({
      status: UserStatus.ACTIVE,
      roles: [RoleName.ADMIN_COMISION_TECNICA],
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should deny access if user does not have required role (Oficial de Mesa intentando rol Arbitro)', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([RoleName.ARBITRO]);

    const context = createMockContext({
      status: UserStatus.ACTIVE,
      roles: [RoleName.OFICIAL_MESA],
    });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should deny access if user is INACTIVE', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([RoleName.ARBITRO]);

    const context = createMockContext({
      status: UserStatus.INACTIVE,
      roles: [RoleName.ARBITRO],
    });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should deny access if user has no roles (PENDING_ROLE)', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([RoleName.ARBITRO]);

    const context = createMockContext({
      status: UserStatus.PENDING_ROLE,
      roles: [],
    });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});
