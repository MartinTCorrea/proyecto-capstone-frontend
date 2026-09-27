import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';
import { AuthService } from './auth.service';
import { RoleName, UserStatus } from '@prisma/client';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let authService: AuthService;

  const mockAuthUser = {
    id: 'user-uuid-1',
    externalId: 'cognito-sub-123',
    email: 'test@sgaob.cl',
    firstName: 'Martín',
    lastName: 'Correa',
    phone: null,
    status: UserStatus.ACTIVE,
    dataConsent: true,
    dataConsentDate: new Date(),
    roles: [RoleName.ARBITRO],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: any) => {
              const config: Record<string, any> = {
                AUTH_PROVIDER: 'local',
                JWT_SECRET: 'test-secret-key-32-chars-long-abcde',
              };
              return config[key] ?? defaultValue;
            }),
          },
        },
        {
          provide: AuthService,
          useValue: {
            validateOrCreateUser: jest.fn().mockResolvedValue(mockAuthUser),
          },
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('validate', () => {
    it('should delegate validation to AuthService and return AuthenticatedUser', async () => {
      const payload = {
        sub: 'cognito-sub-123',
        email: 'test@sgaob.cl',
      };

      const result = await strategy.validate(payload);

      expect(result).toEqual(mockAuthUser);
      expect(authService.validateOrCreateUser).toHaveBeenCalledWith(payload);
    });
  });
});
