import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RoleName, UserStatus } from '@prisma/client';
import { AuthenticatedUser } from './auth.types';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockUser: AuthenticatedUser = {
    id: 'user-uuid-1',
    externalId: 'ext-uuid-1',
    email: 'arbitro@sgaob.cl',
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
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            getProfile: jest.fn().mockResolvedValue(mockUser),
            generateDevToken: jest.fn().mockResolvedValue({
              accessToken: 'mock-dev-token',
              user: mockUser,
            }),
            loginCognito: jest.fn().mockResolvedValue({
              accessToken: 'mock-cognito-id-token',
              user: mockUser,
            }),
            forgotPassword: jest.fn().mockResolvedValue({
              success: true,
              message: 'Código de recuperación despachado',
            }),
            confirmForgotPassword: jest.fn().mockResolvedValue({
              success: true,
              message: 'Contraseña restablecida exitosamente',
            }),
            confirmSignUp: jest.fn().mockResolvedValue({
              success: true,
              message: 'Cuenta confirmada exitosamente',
            }),
            resendConfirmationCode: jest.fn().mockResolvedValue({
              success: true,
              message: 'Nuevo código de confirmación enviado',
            }),
            changePassword: jest.fn().mockResolvedValue({
              success: true,
              message: 'Contraseña actualizada exitosamente',
            }),
            getCognitoConfig: jest.fn().mockReturnValue({
              authProvider: 'cognito',
              region: 'us-east-1',
              userPoolId: 'us-east-1_example',
              clientId: 'test-client-id',
              isConfigured: true,
              hostedUiUrl: 'https://test.auth.us-east-1.amazoncognito.com/login',
            }),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getProfile', () => {
    it('should return user profile from authService', async () => {
      const result = await controller.getProfile(mockUser);
      expect(result).toEqual(mockUser);
      expect(authService.getProfile).toHaveBeenCalledWith(mockUser.id);
    });
  });

  describe('generateDevToken', () => {
    it('should generate dev token and return credentials', async () => {
      const dto = { email: 'arbitro@sgaob.cl', roles: [RoleName.ARBITRO] };
      const result = await controller.generateDevToken(dto);

      expect(result).toHaveProperty('accessToken', 'mock-dev-token');
      expect(result.user).toEqual(mockUser);
      expect(authService.generateDevToken).toHaveBeenCalledWith(dto);
    });
  });

  describe('loginCognito', () => {
    it('should authenticate against Cognito and return tokens', async () => {
      const dto = { email: 'arbitro@sgaob.cl', password: 'ValidPassword123!' };
      const result = await controller.loginCognito(dto);

      expect(result).toHaveProperty('accessToken', 'mock-cognito-id-token');
      expect(result.user).toEqual(mockUser);
      expect(authService.loginCognito).toHaveBeenCalledWith(dto);
    });
  });

  describe('forgotPassword', () => {
    it('should call authService.forgotPassword', async () => {
      const dto = { email: 'arbitro@sgaob.cl' };
      const result = await controller.forgotPassword(dto);

      expect(result.success).toBe(true);
      expect(authService.forgotPassword).toHaveBeenCalledWith(dto);
    });
  });

  describe('confirmForgotPassword', () => {
    it('should call authService.confirmForgotPassword', async () => {
      const dto = {
        email: 'arbitro@sgaob.cl',
        confirmationCode: '123456',
        newPassword: 'NuevaContrasenaSegura2026!',
      };
      const result = await controller.confirmForgotPassword(dto);

      expect(result.success).toBe(true);
      expect(authService.confirmForgotPassword).toHaveBeenCalledWith(dto);
    });
  });

  describe('confirmSignUp', () => {
    it('should call authService.confirmSignUp', async () => {
      const dto = {
        email: 'arbitro@sgaob.cl',
        confirmationCode: '123456',
      };
      const result = await controller.confirmSignUp(dto);

      expect(result.success).toBe(true);
      expect(authService.confirmSignUp).toHaveBeenCalledWith(dto);
    });
  });

  describe('resendConfirmationCode', () => {
    it('should call authService.resendConfirmationCode', async () => {
      const dto = {
        email: 'arbitro@sgaob.cl',
      };
      const result = await controller.resendConfirmationCode(dto);

      expect(result.success).toBe(true);
      expect(authService.resendConfirmationCode).toHaveBeenCalledWith(dto);
    });
  });

  describe('changePassword', () => {
    it('should call authService.changePassword with current user id', async () => {
      const dto = {
        currentPassword: 'Password123!',
        newPassword: 'NuevaContrasenaSegura2026!',
      };
      const result = await controller.changePassword(mockUser, dto);

      expect(result.success).toBe(true);
      expect(authService.changePassword).toHaveBeenCalledWith(mockUser.id, dto);
    });
  });

  describe('getCognitoConfig', () => {
    it('should return public Cognito configuration', () => {
      const result = controller.getCognitoConfig();

      expect(result.authProvider).toBe('cognito');
      expect(result.isConfigured).toBe(true);
      expect(result.region).toBe('us-east-1');
    });
  });
});
