import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../common/prisma/prisma.service';
import { UserStatus, RoleName } from '@prisma/client';
import { JwtPayload, AuthenticatedUser } from './auth.types';
import { DevTokenDto } from './dto/dev-token.dto';

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
