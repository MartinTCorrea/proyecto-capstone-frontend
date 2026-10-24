import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../common/prisma/prisma.service';
import { MailService } from '../../common/mail/mail.service';
import { UserStatus, RoleName } from '@prisma/client';
import { JwtPayload, AuthenticatedUser } from './auth.types';
import {
  DevTokenDto,
  CognitoLoginDto,
  ForgotPasswordDto,
  ConfirmForgotPasswordDto,
  ChangePasswordDto,
} from './dto';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly passwordRecoveryCodes = new Map<string, { code: string; expiresAt: number }>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
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
   * Crea un usuario en AWS Cognito User Pool para que sea utilizable de inmediato (RF01, RF03)
   */
  async createCognitoUser(params: {
    email: string;
    password?: string;
    firstName: string;
    lastName: string;
    phone?: string;
    roles?: RoleName[];
  }): Promise<{ sub?: string; userConfirmed: boolean }> {
    const authProvider = this.configService.get<string>('AUTH_PROVIDER', 'cognito');
    const region = this.configService.get<string>('AWS_REGION', 'us-east-1');
    const clientId = this.configService.get<string>('COGNITO_CLIENT_ID', '');
    const userPoolId = this.configService.get<string>('COGNITO_USER_POOL_ID', '');
    const initialPassword = params.password || 'Temporal2026!';

    const isConfigured = !!(
      clientId &&
      !clientId.includes('your-cognito') &&
      userPoolId &&
      !userPoolId.includes('example')
    );

    if (authProvider === 'local' || !isConfigured) {
      this.logger.log(`[Cognito] Modo local o Cognito no configurado. Registro simulado para: ${params.email}`);
      return { sub: `cognito-local-${Date.now()}`, userConfirmed: true };
    }

    // 1. Si existen credenciales IAM (Learner Lab o Producción), intentar creación administrativa
    const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>('AWS_SECRET_ACCESS_KEY');
    const sessionToken = this.configService.get<string>('AWS_SESSION_TOKEN');

    if (accessKeyId && secretAccessKey) {
      try {
        const adminResult = await this.adminCreateCognitoUser({
          region,
          userPoolId,
          accessKeyId,
          secretAccessKey,
          sessionToken,
          email: params.email,
          password: initialPassword,
          firstName: params.firstName,
          lastName: params.lastName,
          phone: params.phone,
        });
        this.logger.log(`[Cognito Admin] Usuario creado y confirmado exitosamente vía IAM: ${params.email}`);
        return adminResult;
      } catch (adminErr: any) {
        this.logger.warn(`[Cognito Admin] Falla con Admin API (${adminErr.message}), intentando vía Public SignUp...`);
      }
    }

    // 2. Si no hay credenciales IAM o falló Admin API, invocar SignUp con ClientId
    try {
      const response = await fetch(`https://cognito-idp.${region}.amazonaws.com/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-amz-json-1.1',
          'X-Amz-Target': 'AWSCognitoIdentityProviderService.SignUp',
        },
        body: JSON.stringify({
          ClientId: clientId,
          Username: params.email,
          Password: initialPassword,
          UserAttributes: [
            { Name: 'email', Value: params.email },
            { Name: 'given_name', Value: params.firstName },
            { Name: 'family_name', Value: params.lastName },
            ...(params.phone ? [{ Name: 'phone_number', Value: params.phone }] : []),
          ],
        }),
      });

      const data: any = await response.json();

      if (!response.ok || data.__type) {
        const errorType = data.__type || 'CognitoSignUpError';
        const errorMessage = data.message || 'Error al registrar usuario en AWS Cognito';

        if (errorType.includes('UsernameExistsException')) {
          this.logger.log(`Usuario ${params.email} ya existe en AWS Cognito User Pool.`);
          return { userConfirmed: true };
        }
        if (errorType.includes('InvalidPasswordException')) {
          throw new BadRequestException(
            `La contraseña no cumple con la política de seguridad de AWS Cognito: ${errorMessage}`,
          );
        }

        this.logger.warn(`Advertencia al crear en Cognito [${errorType}]: ${errorMessage}`);
        throw new BadRequestException(`Falla al registrar en AWS Cognito: ${errorMessage}`);
      }

      this.logger.log(`Usuario registrado en AWS Cognito vía SignUp: ${params.email} (Sub: ${data.UserSub})`);
      return {
        sub: data.UserSub,
        userConfirmed: !!data.UserConfirmed,
      };
    } catch (err: any) {
      if (err instanceof BadRequestException) throw err;
      this.logger.error(`Error conectando con Cognito SignUp: ${err.message}`);
      this.logger.warn(`No se pudo sincronizar de inmediato con Cognito (${err.message}). Se usará ID provisional.`);
      return { sub: undefined, userConfirmed: false };
    }
  }

  /**
   * Crea un usuario mediante la API Administrativa de Cognito con firma SigV4
   */
  private async adminCreateCognitoUser(params: {
    region: string;
    userPoolId: string;
    accessKeyId: string;
    secretAccessKey: string;
    sessionToken?: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
  }): Promise<{ sub?: string; userConfirmed: boolean }> {
    const payload = JSON.stringify({
      UserPoolId: params.userPoolId,
      Username: params.email,
      TemporaryPassword: params.password,
      MessageAction: 'SUPPRESS',
      UserAttributes: [
        { Name: 'email', Value: params.email },
        { Name: 'email_verified', Value: 'true' },
        { Name: 'given_name', Value: params.firstName },
        { Name: 'family_name', Value: params.lastName },
        ...(params.phone ? [{ Name: 'phone_number', Value: params.phone }] : []),
      ],
    });

    const headers = this.createAwsSigV4Headers({
      region: params.region,
      service: 'cognito-idp',
      target: 'AWSCognitoIdentityProviderService.AdminCreateUser',
      accessKeyId: params.accessKeyId,
      secretAccessKey: params.secretAccessKey,
      sessionToken: params.sessionToken,
      payload,
    });

    const response = await fetch(`https://cognito-idp.${params.region}.amazonaws.com/`, {
      method: 'POST',
      headers,
      body: payload,
    });

    const data: any = await response.json();

    if (!response.ok || data.__type) {
      if (data.__type?.includes('UsernameExistsException')) {
        return { userConfirmed: true };
      }
      throw new Error(data.message || 'Error en AdminCreateUser');
    }

    // Establecer la contraseña permanente para que sea usable de inmediato sin exigir cambio forzado
    try {
      const setPassPayload = JSON.stringify({
        UserPoolId: params.userPoolId,
        Username: params.email,
        Password: params.password,
        Permanent: true,
      });

      const setPassHeaders = this.createAwsSigV4Headers({
        region: params.region,
        service: 'cognito-idp',
        target: 'AWSCognitoIdentityProviderService.AdminSetUserPassword',
        accessKeyId: params.accessKeyId,
        secretAccessKey: params.secretAccessKey,
        sessionToken: params.sessionToken,
        payload: setPassPayload,
      });

      await fetch(`https://cognito-idp.${params.region}.amazonaws.com/`, {
        method: 'POST',
        headers: setPassHeaders,
        body: setPassPayload,
      });
    } catch (setPassErr: any) {
      this.logger.warn(`No se pudo fijar contraseña permanente en AdminSetUserPassword: ${setPassErr.message}`);
    }

    const userSub = data.User?.Attributes?.find((a: any) => a.Name === 'sub')?.Value;
    return { sub: userSub, userConfirmed: true };
  }

  /**
   * Genera cabeceras de autorización AWS SigV4 para llamadas JSON-RPC
   */
  private createAwsSigV4Headers(options: {
    region: string;
    service: string;
    target: string;
    accessKeyId: string;
    secretAccessKey: string;
    sessionToken?: string;
    payload: string;
  }): Record<string, string> {
    const host = `cognito-idp.${options.region}.amazonaws.com`;
    const now = new Date();
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
    const dateStamp = amzDate.substring(0, 8);

    const canonicalUri = '/';
    const canonicalQuerystring = '';
    const payloadHash = crypto.createHash('sha256').update(options.payload).digest('hex');

    let canonicalHeaders = `content-type:application/x-amz-json-1.1\nhost:${host}\nx-amz-date:${amzDate}\nx-amz-target:${options.target}\n`;
    let signedHeaders = 'content-type;host;x-amz-date;x-amz-target';

    if (options.sessionToken) {
      canonicalHeaders += `x-amz-security-token:${options.sessionToken}\n`;
      signedHeaders += ';x-amz-security-token';
    }

    const canonicalRequest = `POST\n${canonicalUri}\n${canonicalQuerystring}\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;
    const credentialScope = `${dateStamp}/${options.region}/${options.service}/aws4_request`;
    const stringToSign = `AWS4-HMAC-SHA256\n${amzDate}\n${credentialScope}\n${crypto
      .createHash('sha256')
      .update(canonicalRequest)
      .digest('hex')}`;

    const kDate = crypto.createHmac('sha256', `AWS4${options.secretAccessKey}`).update(dateStamp).digest();
    const kRegion = crypto.createHmac('sha256', kDate).update(options.region).digest();
    const kService = crypto.createHmac('sha256', kRegion).update(options.service).digest();
    const kSigning = crypto.createHmac('sha256', kService).update('aws4_request').digest();
    const signature = crypto.createHmac('sha256', kSigning).update(stringToSign).digest('hex');

    const authorizationHeader = `AWS4-HMAC-SHA256 Credential=${options.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/x-amz-json-1.1',
      'X-Amz-Date': amzDate,
      'X-Amz-Target': options.target,
      Authorization: authorizationHeader,
    };

    if (options.sessionToken) {
      headers['X-Amz-Security-Token'] = options.sessionToken;
    }

    return headers;
  }

  /**
   * Solicita el restablecimiento de contraseña vía correo electrónico (RF01)
   */
  async forgotPassword(dto: ForgotPasswordDto): Promise<{ success: boolean; message: string }> {
    const email = dto.email.toLowerCase().trim();
    const region = this.configService.get<string>('AWS_REGION', 'us-east-1');
    const clientId = this.configService.get<string>('COGNITO_CLIENT_ID', '');
    const userPoolId = this.configService.get<string>('COGNITO_USER_POOL_ID', '');
    const authProvider = this.configService.get<string>('AUTH_PROVIDER', 'cognito');

    const isConfigured = !!(
      clientId &&
      !clientId.includes('your-cognito') &&
      userPoolId &&
      !userPoolId.includes('example')
    );

    const user = await this.prisma.user.findUnique({ where: { email } });

    if (authProvider === 'cognito' && isConfigured) {
      try {
        const response = await fetch(`https://cognito-idp.${region}.amazonaws.com/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-amz-json-1.1',
            'X-Amz-Target': 'AWSCognitoIdentityProviderService.ForgotPassword',
          },
          body: JSON.stringify({
            ClientId: clientId,
            Username: email,
          }),
        });

        const data: any = await response.json();

        if (!response.ok || data.__type) {
          const errorType = data.__type || 'CognitoForgotPasswordError';
          const errorMessage = data.message || 'Error en AWS Cognito';
          this.logger.warn(`Error en Cognito ForgotPassword [${errorType}]: ${errorMessage}`);

          if (errorType.includes('UserNotFoundException')) {
            return {
              success: true,
              message: 'Si el correo se encuentra registrado en AWS Cognito, recibirás un código de recuperación.',
            };
          }
          if (errorType.includes('LimitExceededException')) {
            throw new BadRequestException('Límite de solicitudes de recuperación superado. Por favor espera unos minutos.');
          }

          throw new BadRequestException(`Falla en AWS Cognito: ${errorMessage}`);
        }

        const destination = data.CodeDeliveryDetails?.Destination || email;
        this.logger.log(`Código de recuperación enviado por Cognito a ${destination} para el usuario ${email}`);

        return {
          success: true,
          message: `Código de recuperación enviado al correo registrado (${destination}).`,
        };
      } catch (err: any) {
        if (err instanceof BadRequestException) throw err;
        this.logger.error(`Error conectando con AWS Cognito ForgotPassword: ${err.message}`);
      }
    }

    // Fallback / Modo Local: Generar código de 6 dígitos en memoria y despachar vía MailService
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutos de validez
    this.passwordRecoveryCodes.set(email, { code, expiresAt });

    await this.mailService.sendPasswordResetCode({
      to: email,
      code,
      userName: user ? `${user.firstName} ${user.lastName}` : undefined,
    });

    this.logger.log(`Código de recuperación generado localmente para ${email}: [${code}]`);

    return {
      success: true,
      message: 'Si el correo se encuentra registrado, recibirás un código de recuperación en tu bandeja de entrada.',
    };
  }

  /**
   * Confirma el restablecimiento de contraseña utilizando el código de 6 dígitos
   */
  async confirmForgotPassword(dto: ConfirmForgotPasswordDto): Promise<{ success: boolean; message: string }> {
    const email = dto.email.toLowerCase().trim();
    const region = this.configService.get<string>('AWS_REGION', 'us-east-1');
    const clientId = this.configService.get<string>('COGNITO_CLIENT_ID', '');
    const userPoolId = this.configService.get<string>('COGNITO_USER_POOL_ID', '');
    const authProvider = this.configService.get<string>('AUTH_PROVIDER', 'cognito');

    const isConfigured = !!(
      clientId &&
      !clientId.includes('your-cognito') &&
      userPoolId &&
      !userPoolId.includes('example')
    );

    if (authProvider === 'cognito' && isConfigured) {
      try {
        const response = await fetch(`https://cognito-idp.${region}.amazonaws.com/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-amz-json-1.1',
            'X-Amz-Target': 'AWSCognitoIdentityProviderService.ConfirmForgotPassword',
          },
          body: JSON.stringify({
            ClientId: clientId,
            Username: email,
            ConfirmationCode: dto.confirmationCode.trim(),
            Password: dto.newPassword,
          }),
        });

        const data: any = await response.json();

        if (!response.ok || data.__type) {
          const errorType = data.__type || 'CognitoConfirmForgotPasswordError';
          const errorMessage = data.message || 'Error en AWS Cognito';
          this.logger.warn(`Error en Cognito ConfirmForgotPassword [${errorType}]: ${errorMessage}`);

          if (errorType.includes('CodeMismatchException')) {
            throw new BadRequestException('El código de confirmación ingresado es incorrecto.');
          }
          if (errorType.includes('ExpiredCodeException')) {
            throw new BadRequestException('El código de confirmación ha expirado. Por favor solicita uno nuevo.');
          }
          if (errorType.includes('InvalidPasswordException')) {
            throw new BadRequestException(`La nueva contraseña no cumple los requisitos: ${errorMessage}`);
          }

          throw new BadRequestException(`Falla en AWS Cognito: ${errorMessage}`);
        }

        this.logger.log(`Contraseña restablecida exitosamente en AWS Cognito para ${email}`);

        const user = await this.prisma.user.findUnique({ where: { email } });
        await this.mailService.sendPasswordChangedAlert({
          to: email,
          userId: user?.id,
          userName: user ? `${user.firstName} ${user.lastName}` : undefined,
        });

        return {
          success: true,
          message: 'Tu contraseña ha sido restablecida exitosamente en AWS Cognito. Ya puedes iniciar sesión.',
        };
      } catch (err: any) {
        if (err instanceof BadRequestException) throw err;
        this.logger.error(`Error conectando con AWS Cognito ConfirmForgotPassword: ${err.message}`);
      }
    }

    // Modo local / fallback
    const stored = this.passwordRecoveryCodes.get(email);
    if (!stored || stored.expiresAt < Date.now()) {
      throw new BadRequestException('No hay una solicitud de recuperación activa o el código ha expirado.');
    }
    if (stored.code !== dto.confirmationCode.trim()) {
      throw new BadRequestException('El código de confirmación ingresado no coincide.');
    }

    this.passwordRecoveryCodes.delete(email);

    const user = await this.prisma.user.findUnique({ where: { email } });
    await this.mailService.sendPasswordChangedAlert({
      to: email,
      userId: user?.id,
      userName: user ? `${user.firstName} ${user.lastName}` : undefined,
    });

    return {
      success: true,
      message: 'Contraseña restablecida exitosamente. Ya puedes iniciar sesión con tu nueva contraseña.',
    };
  }

  /**
   * Cambia la contraseña del usuario actualmente autenticado (RF01)
   */
  async changePassword(userId: string, dto: ChangePasswordDto): Promise<{ success: boolean; message: string }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`Usuario con ID ${userId} no encontrado`);
    }

    const region = this.configService.get<string>('AWS_REGION', 'us-east-1');
    const clientId = this.configService.get<string>('COGNITO_CLIENT_ID', '');
    const userPoolId = this.configService.get<string>('COGNITO_USER_POOL_ID', '');
    const authProvider = this.configService.get<string>('AUTH_PROVIDER', 'cognito');

    const isConfigured = !!(
      clientId &&
      !clientId.includes('your-cognito') &&
      userPoolId &&
      !userPoolId.includes('example')
    );

    if (authProvider === 'cognito' && isConfigured) {
      // 1. Validar la contraseña actual mediante InitiateAuth
      const authResponse = await fetch(`https://cognito-idp.${region}.amazonaws.com/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-amz-json-1.1',
          'X-Amz-Target': 'AWSCognitoIdentityProviderService.InitiateAuth',
        },
        body: JSON.stringify({
          AuthFlow: 'USER_PASSWORD_AUTH',
          ClientId: clientId,
          AuthParameters: {
            USERNAME: user.email,
            PASSWORD: dto.currentPassword,
          },
        }),
      });

      const authData: any = await authResponse.json();
      if (!authResponse.ok || authData.__type || !authData.AuthenticationResult?.AccessToken) {
        throw new BadRequestException('La contraseña actual ingresada es incorrecta.');
      }

      const accessToken = authData.AuthenticationResult.AccessToken;

      // 2. Invocar ChangePassword en Cognito con el AccessToken
      const changeResponse = await fetch(`https://cognito-idp.${region}.amazonaws.com/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-amz-json-1.1',
          'X-Amz-Target': 'AWSCognitoIdentityProviderService.ChangePassword',
        },
        body: JSON.stringify({
          AccessToken: accessToken,
          PreviousPassword: dto.currentPassword,
          ProposedPassword: dto.newPassword,
        }),
      });

      const changeData: any = await changeResponse.json();
      if (!changeResponse.ok || changeData.__type) {
        const errorMsg = changeData.message || 'Error al cambiar contraseña en AWS Cognito';
        if (changeData.__type?.includes('InvalidPasswordException')) {
          throw new BadRequestException(
            `La nueva contraseña no cumple con los requisitos de seguridad: ${errorMsg}`,
          );
        }
        throw new BadRequestException(errorMsg);
      }
    }

    // Notificar al usuario por correo
    await this.mailService.sendPasswordChangedAlert({
      to: user.email,
      userId: user.id,
      userName: `${user.firstName} ${user.lastName}`,
    });

    this.logger.log(`Contraseña actualizada exitosamente para el usuario ${user.email}`);

    return {
      success: true,
      message: 'Contraseña actualizada exitosamente.',
    };
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
