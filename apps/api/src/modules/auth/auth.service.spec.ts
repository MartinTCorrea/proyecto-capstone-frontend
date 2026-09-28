import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { NotFoundException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RoleName, UserStatus } from '@prisma/client';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;
  let jwtService: JwtService;

  const mockUser = {
    id: 'user-uuid-1',
    externalId: 'ext-uuid-1',
    email: 'arbitro@sgaob.cl',
    firstName: 'Martín',
    lastName: 'Correa',
    phone: '+56912345678',
    status: UserStatus.ACTIVE,
    dataConsent: true,
    dataConsentDate: new Date(),
    roles: [
      {
        role: {
          id: 'role-uuid-1',
          name: RoleName.ARBITRO,
        },
      },
    ],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
            role: {
              findUnique: jest.fn(),
            },
            userRole: {
              upsert: jest.fn(),
            },
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: any) => {
              if (key === 'AUTH_PROVIDER') return 'local';
              return defaultValue;
            }),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('mock.jwt.token'),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateOrCreateUser', () => {
    it('should return existing user mapped when found by externalId', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(mockUser);

      const result = await service.validateOrCreateUser({
        sub: 'ext-uuid-1',
        email: 'arbitro@sgaob.cl',
      });

      expect(result.id).toBe('user-uuid-1');
      expect(result.externalId).toBe('ext-uuid-1');
      expect(result.roles).toContain(RoleName.ARBITRO);
      expect(prisma.user.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { externalId: 'ext-uuid-1' } }),
      );
    });

    it('should link externalId when user exists by email but has no externalId match', async () => {
      // 1st call by externalId returns null
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(null);
      // 2nd call by email returns user
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(mockUser);
      // update returns updated user
      (prisma.user.update as jest.Mock).mockResolvedValueOnce({
        ...mockUser,
        externalId: 'new-ext-uuid',
      });

      const result = await service.validateOrCreateUser({
        sub: 'new-ext-uuid',
        email: 'arbitro@sgaob.cl',
      });

      expect(result.externalId).toBe('new-ext-uuid');
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-uuid-1' },
          data: { externalId: 'new-ext-uuid' },
        }),
      );
    });

    it('should auto-provision new user in PENDING_ROLE when not found in database', async () => {
      (prisma.user.findUnique as jest.Mock)
        .mockResolvedValueOnce(null) // by externalId
        .mockResolvedValueOnce(null); // by email

      const newProvisionedUser = {
        id: 'new-user-uuid',
        externalId: 'new-sub-123',
        email: 'nuevo@sgaob.cl',
        firstName: 'Pedro',
        lastName: 'González',
        status: UserStatus.PENDING_ROLE,
        dataConsent: false,
        dataConsentDate: null,
        roles: [],
      };

      (prisma.user.create as jest.Mock).mockResolvedValueOnce(newProvisionedUser);

      const result = await service.validateOrCreateUser({
        sub: 'new-sub-123',
        email: 'nuevo@sgaob.cl',
        given_name: 'Pedro',
        family_name: 'González',
      });

      expect(result.status).toBe(UserStatus.PENDING_ROLE);
      expect(result.roles).toHaveLength(0);
      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            externalId: 'new-sub-123',
            email: 'nuevo@sgaob.cl',
            status: UserStatus.PENDING_ROLE,
          }),
        }),
      );
    });
  });

  describe('getProfile', () => {
    it('should return profile of user by id', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(mockUser);

      const result = await service.getProfile('user-uuid-1');

      expect(result.id).toBe('user-uuid-1');
      expect(result.roles).toEqual([RoleName.ARBITRO]);
    });

    it('should throw NotFoundException if user does not exist', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(null);

      await expect(service.getProfile('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

    describe('generateDevToken', () => {
    it('should generate JWT token and return user profile', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(mockUser);

      const result = await service.generateDevToken({
        email: 'arbitro@sgaob.cl',
        roles: [RoleName.ARBITRO],
      });

      expect(result).toHaveProperty('accessToken', 'mock.jwt.token');
      expect(result.user.email).toBe('arbitro@sgaob.cl');
      expect(jwtService.sign).toHaveBeenCalled();
    });
  });

  describe('loginCognito', () => {
    it('should throw BadRequestException if Cognito is not configured in .env', async () => {
      await expect(
        service.loginCognito({
          email: 'arbitro@sgaob.cl',
          password: 'Password123!',
        }),
      ).rejects.toThrow();
    });
  });

  describe('getCognitoConfig', () => {
    it('should return public Cognito configuration structure', () => {
      const config = service.getCognitoConfig();
      expect(config).toHaveProperty('authProvider');
      expect(config).toHaveProperty('region');
      expect(config).toHaveProperty('isConfigured');
    });
  });
});
