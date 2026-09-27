import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../../common/audit/audit.service';
import { RoleName, UserStatus } from '@prisma/client';
import { AuditAction } from '@sgaob/shared';
import { AuthenticatedUser } from '../auth/auth.types';
import {
  CreateUserDto,
  UpdateUserDto,
  AssignRolesDto,
  UpdateUserStatusDto,
  QueryUsersDto,
} from './dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Crea un nuevo usuario en la base de datos (RF03, CU-02)
   */
  async createUser(dto: CreateUserDto, creatorId?: string): Promise<AuthenticatedUser> {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException(
        `Ya existe un usuario registrado con el correo electrónico ${dto.email}`,
      );
    }

    // externalId temporal para usuarios pre-creados hasta que hagan su primer login en Cognito/Entra
    const externalId = `pre-${dto.email}`;
    const initialStatus = dto.status || (dto.roles && dto.roles.length > 0 ? UserStatus.ACTIVE : UserStatus.PENDING_ROLE);

    const createdUser = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          externalId,
          email: dto.email,
          firstName: dto.firstName,
          lastName: dto.lastName,
          phone: dto.phone,
          status: initialStatus,
          dataConsent: false,
        },
      });

      if (dto.roles && dto.roles.length > 0) {
        for (const roleName of dto.roles) {
          const roleRecord = await tx.role.findUnique({ where: { name: roleName } });
          if (roleRecord) {
            await tx.userRole.create({
              data: {
                userId: user.id,
                roleId: roleRecord.id,
              },
            });
          }
        }
      }

      return tx.user.findUnique({
        where: { id: user.id },
        include: {
          roles: {
            include: { role: true },
          },
        },
      });
    });

    const result = this.mapToAuthenticatedUser(createdUser!);

    await this.auditService.log({
      userId: creatorId,
      action: AuditAction.USER_CREATED,
      entityType: 'User',
      entityId: result.id,
      details: { email: result.email, roles: result.roles, status: result.status },
    });

    this.logger.log(`Usuario creado exitosamente: ${result.email} (ID: ${result.id})`);
    return result;
  }

  /**
   * Lista usuarios con paginación y filtros por rol, estado o búsqueda por texto (RF03)
   */
  async findAll(query: QueryUsersDto): Promise<{
    data: AuthenticatedUser[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.status) {
      where.status = query.status;
    }

    if (query.role) {
      where.roles = {
        some: {
          role: {
            name: query.role,
          },
        },
      };
    }

    if (query.search) {
      const term = query.search.trim();
      where.OR = [
        { firstName: { contains: term, mode: 'insensitive' } },
        { lastName: { contains: term, mode: 'insensitive' } },
        { email: { contains: term, mode: 'insensitive' } },
      ];
    }

    const [total, users] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          roles: {
            include: { role: true },
          },
        },
      }),
    ]);

    return {
      data: users.map((u) => this.mapToAuthenticatedUser(u)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Obtiene un usuario específico por su ID único (RF03)
   */
  async findById(id: string): Promise<AuthenticatedUser> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        roles: {
          include: { role: true },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado en el sistema`);
    }

    return this.mapToAuthenticatedUser(user);
  }

  /**
   * Actualiza los datos personales de un usuario (RF03)
   */
  async updateUser(id: string, dto: UpdateUserDto, editorId?: string): Promise<AuthenticatedUser> {
    await this.findById(id);

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        ...(dto.firstName !== undefined && { firstName: dto.firstName }),
        ...(dto.lastName !== undefined && { lastName: dto.lastName }),
        ...(dto.phone !== undefined && { phone: dto.phone }),
      },
      include: {
        roles: {
          include: { role: true },
        },
      },
    });

    const result = this.mapToAuthenticatedUser(updated);

    await this.auditService.log({
      userId: editorId,
      action: AuditAction.USER_UPDATED,
      entityType: 'User',
      entityId: result.id,
      details: { updatedFields: dto },
    });

    return result;
  }

  /**
   * Asignación estricta de roles técnicos (RF02, Anexo A.1)
   * Valida la independencia de roles entre ARBITRO y OFICIAL_MESA.
   */
  async assignRoles(id: string, dto: AssignRolesDto, adminId: string): Promise<AuthenticatedUser> {
    const user = await this.findById(id);
    const previousRoles = user.roles;

    const updated = await this.prisma.$transaction(async (tx) => {
      // 1. Eliminar roles previos
      await tx.userRole.deleteMany({
        where: { userId: id },
      });

      // 2. Asignar los nuevos roles
      for (const roleName of dto.roles) {
        const role = await tx.role.findUnique({ where: { name: roleName } });
        if (!role) {
          throw new NotFoundException(`Rol ${roleName} no existe en el catálogo de roles del sistema`);
        }
        await tx.userRole.create({
          data: {
            userId: id,
            roleId: role.id,
          },
        });
      }

      // 3. Si estaba en PENDING_ROLE y ahora tiene roles, activar usuario
      const newStatus = user.status === UserStatus.PENDING_ROLE ? UserStatus.ACTIVE : user.status;

      return tx.user.update({
        where: { id },
        data: { status: newStatus },
        include: {
          roles: {
            include: { role: true },
          },
        },
      });
    });

    const result = this.mapToAuthenticatedUser(updated);

    await this.auditService.log({
      userId: adminId,
      action: AuditAction.ROLES_ASSIGNED,
      entityType: 'User',
      entityId: id,
      details: { previousRoles, newRoles: dto.roles },
    });

    this.logger.log(
      `Roles asignados al usuario ${result.email}: [${result.roles.join(', ')}] por Admin ${adminId}`,
    );

    return result;
  }

  /**
   * Habilita, deshabilita o cambia el estado de un usuario (RF03)
   */
  async updateStatus(
    id: string,
    dto: UpdateUserStatusDto,
    adminId: string,
  ): Promise<AuthenticatedUser> {
    const user = await this.findById(id);
    const previousStatus = user.status;

    const updated = await this.prisma.user.update({
      where: { id },
      data: { status: dto.status },
      include: {
        roles: {
          include: { role: true },
        },
      },
    });

    const result = this.mapToAuthenticatedUser(updated);

    await this.auditService.log({
      userId: adminId,
      action: AuditAction.USER_UPDATED,
      entityType: 'User',
      entityId: id,
      details: { statusChange: { from: previousStatus, to: dto.status } },
    });

    this.logger.log(`Estado de usuario ${result.email} actualizado a ${dto.status} por Admin ${adminId}`);
    return result;
  }

  /**
   * Registro formal de consentimiento de tratamiento de datos personales (RF01, NFR Privacidad)
   */
  async recordConsent(
    userId: string,
    ipAddress?: string,
  ): Promise<{ success: boolean; dataConsentDate: Date }> {
    const consentDate = new Date();

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        dataConsent: true,
        dataConsentDate: consentDate,
      },
    });

    await this.auditService.log({
      userId,
      action: AuditAction.USER_UPDATED,
      entityType: 'User',
      entityId: userId,
      details: { action: 'DATA_CONSENT_ACCEPTED', consentDate },
      ipAddress,
    });

    this.logger.log(`Consentimiento de tratamiento de datos registrado para usuario ${userId}`);
    return { success: true, dataConsentDate: consentDate };
  }

  /**
   * Mapea el registro Prisma a la interfaz AuthenticatedUser
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
