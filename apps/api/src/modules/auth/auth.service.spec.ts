import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { NotFoundException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { MailService } from '../../common/mail/mail.service';
import { RoleName, UserStatus } from '@prisma/client';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;
  let jwtService: JwtService;
  let mailService: MailService;

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
        {
          provide: MailService,
          useValue: {
            sendMail: jest.fn().mockResolvedValue({ success: true }),
            sendPasswordResetCode: jest.fn().mockResolvedValue({ success: true }),
            sendPasswordChangedAlert: jest.fn().mockResolvedValue({ success: true }),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
    mailService = module.get<MailService>(MailService);
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
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(null);
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(mockUser);
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
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);

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

  describe('createCognitoUser', () => {
    it('should simulate user creation in local auth mode', async () => {
      const result = await service.createCognitoUser({
        email: 'nuevo.oficial@sgaob.cl',
        firstName: 'Ana',
        lastName: 'Gómez',
      });

      expect(result).toHaveProperty('sub');
      expect(result.sub).toContain('cognito-local');
      expect(result.userConfirmed).toBe(true);
    });
  });

  describe('forgotPassword and confirmForgotPassword (Local fallback)', () => {
    it('should send a verification code and allow resetting password', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const forgotRes = await service.forgotPassword({ email: 'arbitro@sgaob.cl' });
      expect(forgotRes.success).toBe(true);
      expect(mailService.sendPasswordResetCode).toHaveBeenCalled();

      const lastCall = (mailService.sendPasswordResetCode as jest.Mock).mock.calls[0][0];
      const code = lastCall.code;
      expect(code).toBeDefined();

      const confirmRes = await service.confirmForgotPassword({
        email: 'arbitro@sgaob.cl',
        confirmationCode: code,
        newPassword: 'NuevaContrasenaSegura2026!',
      });

      expect(confirmRes.success).toBe(true);
      expect(mailService.sendPasswordChangedAlert).toHaveBeenCalled();
    });
  });

  describe('changePassword', () => {
    it('should update password and send alert notification', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(mockUser);

      const result = await service.changePassword('user-uuid-1', {
        currentPassword: 'Password123!',
        newPassword: 'NuevaContrasenaSegura2026!',
      });

      expect(result.success).toBe(true);
      expect(mailService.sendPasswordChangedAlert).toHaveBeenCalled();
    });

    it('should throw NotFoundException if user is not found', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(null);

      await expect(
        service.changePassword('non-existent', {
          currentPassword: 'Password123!',
          newPassword: 'NuevaContrasenaSegura2026!',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('confirmSignUp and resendConfirmationCode', () => {
    it('should confirm user account locally when cognito is not configured', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(mockUser);

      const result = await service.confirmSignUp({
        email: 'arbitro@sgaob.cl',
        confirmationCode: '123456',
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain('Cuenta confirmada exitosamente');
    });

    it('should resend confirmation code successfully', async () => {
      const result = await service.resendConfirmationCode({
        email: 'arbitro@sgaob.cl',
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain('confirmación');
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
