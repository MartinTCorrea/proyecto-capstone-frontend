import { Injectable, Logger, NotFoundException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../common/prisma/prisma.service';
import { UserStatus, RoleName } from '@prisma/client';
import { JwtPayload, AuthenticatedUser } from './auth.types';
import { DevTokenDto } from './dto/dev-token.dto';
import { CognitoLoginDto } from './dto/cognito-login.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Valida un usuario autenticado por token OIDC/JWT y aplica la política de sincronización
   * y auto-aprovisionamiento Just-in-Time (JIT) acordada en el Paso 0.
   */
  async validateOrCreateUser(payload: JwtPayload): Promise<AuthenticatedUser> {
    const externalId = payload.sub;
    const email = payload.email?.toLowerCase().trim();

    // 1. Buscar usuario por externalId
    let user = await this.prisma.user.findUnique({
      where: { externalId },
      include: {
        roles: {
          include: { role: true },
        },
      },
    });

    // 2. Si no se encuentra por externalId, buscar por email para vincular perfil pre-creado (CU-02)
    if (!user && email) {
      user = await this.prisma.user.findUnique({
        where: { email },
        include: {
          roles: {
            include: { role: true },
          },
        },
      });

      if (user) {
        // Vincular el externalId de Cognito / Entra al usuario pre-creado por la Comisión Técnica
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: { externalId },
          include: {
            roles: {
              include: { role: true },
            },
          },
        });
        this.logger.log(`Usuario pre-registrado vinculado a externalId [${externalId}]: ${email}`);
      }
    }

    // 3. Si no existe en BD, crear registro nuevo con estado PENDING_ROLE (JIT Provisioning)
    if (!user) {
      const userEmail = email || `${externalId}@sgaob.placeholder`;
      const firstName = payload.given_name || payload.name?.split(' ')[0] || 'Usuario';
      const lastName = payload.family_name || payload.name?.split(' ').slice(1).join(' ') || 'Registrado';

      user = await this.prisma.user.create({
        data: {
          externalId,
          email: userEmail,
          firstName,
          lastName,
          status: UserStatus.PENDING_ROLE,
          dataConsent: false,
        },
        include: {
          roles: {
            include: { role: true },
          },
        },
      });

      this.logger.log(`Nuevo usuario auto-aprovisionado en estado PENDING_ROLE: ${userEmail} (ID: ${user.id})`);
    }

    // 4. Si el token contiene grupos de Cognito (cognito:groups), sincronizar roles
    const rawGroups = payload['cognito:groups'] || payload.roles || [];
    const tokenGroups: string[] = Array.isArray(rawGroups) ? rawGroups : [rawGroups];

    if (tokenGroups.length > 0) {
      let assignedCount = 0;
      for (const groupName of tokenGroups) {
        const roleRecord = await this.prisma.role.findUnique({
          where: { name: groupName as RoleName },
        });

        if (roleRecord) {
          await this.prisma.userRole.upsert({
            where: {
              userId_roleId: {
                userId: user.id,
                roleId: roleRecord.id,
              },
            },
            update: {},
            create: {
              userId: user.id,
              roleId: roleRecord.id,
            },
          });
          assignedCount++;
        }
      }

      if (assignedCount > 0 && user.status === UserStatus.PENDING_ROLE) {
        user = (await this.prisma.user.update({
          where: { id: user.id },
          data: { status: UserStatus.ACTIVE },
          include: {
            roles: {
              include: { role: true },
            },
          },
        }))!;
      } else if (assignedCount > 0) {
        user = (await this.prisma.user.findUnique({
          where: { id: user.id },
          include: {
            roles: {
              include: { role: true },
            },
          },
        }))!;
      }
    }

    return this.mapToAuthenticatedUser(user);
  }

  /**
   * Obtiene el perfil completo del usuario autenticado actual
   */
  async getProfile(userId: string): Promise<AuthenticatedUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: {
          include: { role: true },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`Usuario con ID ${userId} no encontrado en el sistema`);
    }

    return this.mapToAuthenticatedUser(user);
  }

  /**
   * Genera un token JWT para pruebas y desarrollo local offline (AUTH_PROVIDER=local)
   */
  async generateDevToken(dto: DevTokenDto): Promise<{ accessToken: string; user: AuthenticatedUser }> {
    const email = dto.email.toLowerCase().trim();
    const externalId = `dev-${email}`;

    let user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        roles: {
          include: { role: true },
        },
      },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          externalId,
          email,
          firstName: dto.firstName || 'Usuario',
          lastName: dto.lastName || 'Desarrollo',
          status: UserStatus.ACTIVE,
          dataConsent: true,
          dataConsentDate: new Date(),
        },
        include: {
          roles: {
            include: { role: true },
          },
        },
      });

      // Si se indicaron roles en el DTO, asignarlos
      if (dto.roles && dto.roles.length > 0) {
        for (const roleName of dto.roles) {
          const roleRecord = await this.prisma.role.findUnique({ where: { name: roleName } });
          if (roleRecord) {
            await this.prisma.userRole.upsert({
              where: {
                userId_roleId: {
                  userId: user.id,
                  roleId: roleRecord.id,
                },
              },
              update: {},
              create: {
                userId: user.id,
                roleId: roleRecord.id,
              },
            });
          }
        }

        // Recargar con los roles asignados
        user = (await this.prisma.user.findUnique({
          where: { id: user.id },
          include: {
            roles: {
              include: { role: true },
            },
          },
        }))!;
      }
    }

    const authUser = this.mapToAuthenticatedUser(user);

    const payload = {
      sub: user.externalId,
      email: user.email,
      roles: authUser.roles,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: authUser,
    };
  }

  /**
   * Autentica un usuario contra AWS Cognito mediante InitiateAuth (USER_PASSWORD_AUTH)
   */
  async loginCognito(dto: CognitoLoginDto): Promise<{ accessToken: string; user: AuthenticatedUser }> {
    const region = this.configService.get<string>('AWS_REGION', 'us-east-1');
    const clientId = this.configService.get<string>('COGNITO_CLIENT_ID', '');
    const userPoolId = this.configService.get<string>('COGNITO_USER_POOL_ID', '');

    if (!clientId || clientId.includes('your-cognito') || !userPoolId || userPoolId.includes('example')) {
      throw new BadRequestException(
        'AWS Cognito no está configurado en las variables de entorno. Por favor define COGNITO_USER_POOL_ID y COGNITO_CLIENT_ID en .env.',
      );
    }

    try {
      const response = await fetch(`https://cognito-idp.${region}.amazonaws.com/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-amz-json-1.1',
          'X-Amz-Target': 'AWSCognitoIdentityProviderService.InitiateAuth',
        },
        body: JSON.stringify({
          AuthFlow: 'USER_PASSWORD_AUTH',
          ClientId: clientId,
          AuthParameters: {
            USERNAME: dto.email,
            PASSWORD: dto.password,
          },
        }),
      });

      const data: any = await response.json();

      if (!response.ok || data.__type) {
        const errorType = data.__type || 'CognitoAuthError';
        const errorMessage = data.message || 'Error de autenticación con AWS Cognito';
        this.logger.warn(`Error en AWS Cognito [${errorType}]: ${errorMessage}`);

        if (errorType.includes('NotAuthorizedException') || errorType.includes('UserNotFoundException')) {
          throw new UnauthorizedException('Credenciales inválidas en AWS Cognito (usuario o contraseña incorrectos)');
        }
        if (errorType.includes('UserNotConfirmedException')) {
          throw new UnauthorizedException('La cuenta de AWS Cognito no ha sido confirmada todavía');
        }

        throw new BadRequestException(`Falla en AWS Cognito: ${errorMessage}`);
      }

      let authResult = data.AuthenticationResult;

      // Si Cognito solicita NEW_PASSWORD_REQUIRED (usuario creado con contraseña temporal por el admin),
      // respondemos automáticamente al desafío para establecer la contraseña como definitiva.
      if (!authResult && data.ChallengeName === 'NEW_PASSWORD_REQUIRED' && data.Session) {
        this.logger.log(`Usuario [${dto.email}] en estado FORCE_CHANGE_PASSWORD. Confirmando contraseña definitiva automáticamente en AWS Cognito...`);
        const challengeResponse = await fetch(`https://cognito-idp.${region}.amazonaws.com/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-amz-json-1.1',
            'X-Amz-Target': 'AWSCognitoIdentityProviderService.RespondToAuthChallenge',
          },
          body: JSON.stringify({
            ChallengeName: 'NEW_PASSWORD_REQUIRED',
            ClientId: clientId,
            ChallengeResponses: {
              USERNAME: dto.email,
              NEW_PASSWORD: dto.password,
            },
            Session: data.Session,
          }),
        });

        const challengeData: any = await challengeResponse.json();
        authResult = challengeData.AuthenticationResult;

        if (!authResult) {
          const msg = challengeData.message || 'Se requiere cambio de contraseña inicial en AWS Cognito';
          throw new BadRequestException(msg);
        }
      }

      const idToken = authResult?.IdToken;
      const accessToken = authResult?.AccessToken;

      if (!idToken && !accessToken) {
        throw new UnauthorizedException('Cognito no retornó tokens de acceso válidos');
      }

      const tokenToDecode = idToken || accessToken;
      const payload = this.jwtService.decode(tokenToDecode) as JwtPayload;

      if (!payload || !payload.sub) {
        throw new UnauthorizedException('El token devuelto por Cognito es inválido o no posee claims estándar');
      }

      const user = await this.validateOrCreateUser(payload);

      return {
        accessToken: tokenToDecode,
        user,
      };
    } catch (error: any) {
      if (error instanceof UnauthorizedException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Error inesperado al conectar con AWS Cognito: ${error.message}`, error.stack);
      throw new BadRequestException(`No se pudo conectar con AWS Cognito: ${error.message}`);
    }
  }

  /**
   * Obtiene la configuración pública de AWS Cognito para el frontend
   */
  getCognitoConfig(): {
    authProvider: string;
    region: string;
    userPoolId: string;
    clientId: string;
    isConfigured: boolean;
    hostedUiUrl?: string;
  } {
    const authProvider = this.configService.get<string>('AUTH_PROVIDER', 'cognito');
    const region = this.configService.get<string>('AWS_REGION', 'us-east-1');
    const userPoolId = this.configService.get<string>('COGNITO_USER_POOL_ID', '');
    const clientId = this.configService.get<string>('COGNITO_CLIENT_ID', '');
    const cognitoDomain = this.configService.get<string>('COGNITO_DOMAIN', '');
    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:5173');

    const isConfigured = !!(
      clientId &&
      !clientId.includes('your-cognito') &&
      userPoolId &&
      !userPoolId.includes('example')
    );

    let hostedUiUrl: string | undefined;
    if (isConfigured && cognitoDomain) {
      hostedUiUrl = `https://${cognitoDomain}.auth.${region}.amazoncognito.com/login?client_id=${clientId}&response_type=token&scope=email+openid+profile&redirect_uri=${encodeURIComponent(frontendUrl)}`;
    }

    return {
      authProvider,
      region,
      userPoolId,
      clientId,
      isConfigured,
      hostedUiUrl,
    };
  }

  /**
   * Mapea la entidad de Prisma a la interfaz AuthenticatedUser
   */
  private mapToAuthenticatedUser(user: any): AuthenticatedUser {
    const roles: RoleName[] = user.roles ? user.roles.map((ur: any) => ur.role.name) : [];

    return {
      id: user.id,
      externalId: user.externalId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      status: user.status,
      dataConsent: user.dataConsent,
      dataConsentDate: user.dataConsentDate,
      roles,
    };
  }
}
