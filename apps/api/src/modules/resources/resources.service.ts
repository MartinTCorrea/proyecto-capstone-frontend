import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../../common/audit/audit.service';
import {
  CreateResourceDto,
  UpdateResourceDto,
  QueryResourcesDto,
  ExportNominationsDto,
} from './dto';
import {
  RoleName,
  ResourceType,
  ResourceVisibility,
  AuditAction,
} from '@sgaob/shared';

@Injectable()
export class ResourcesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Consulta paginada y filtrada de recursos respetando la visibilidad del usuario (RF17, RF18, RF19)
   */
  async getResources(
    query: QueryResourcesDto,
    _currentUserId: string,
    userRoles: RoleName[],
  ) {
    const isAdmin = (userRoles || []).includes(RoleName.ADMIN_COMISION_TECNICA);
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    // 1. Control estricto de visibilidad (RF18, Anexo A.5)
    if (!isAdmin) {
      // Usuarios no administradores NUNCA pueden ver credenciales ni recursos ADMIN
      where.type = { not: ResourceType.CREDENCIAL };
      where.visibility = {
        in: [ResourceVisibility.PUBLIC, ResourceVisibility.AUTHENTICATED],
      };
    } else if (query.visibility) {
      where.visibility = query.visibility;
    }

    // 2. Filtro por tipo de recurso
    if (query.type) {
      where.type = query.type;
    }

    // 3. Búsqueda textual
    if (query.search && query.search.trim()) {
      const term = query.search.trim();
      where.OR = [
        { title: { contains: term, mode: 'insensitive' } },
        { description: { contains: term, mode: 'insensitive' } },
        { content: { contains: term, mode: 'insensitive' } },
      ];
    }

    const [total, data] = await Promise.all([
      this.prisma.resource.count({ where }),
      this.prisma.resource.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Obtiene un recurso específico validando permisos de visibilidad
   */
  async getResourceById(
    id: string,
    _currentUserId: string,
    userRoles: RoleName[],
  ) {
    const resource = await this.prisma.resource.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!resource) {
      throw new NotFoundException(`Recurso con ID ${id} no encontrado`);
    }

    const isAdmin = (userRoles || []).includes(RoleName.ADMIN_COMISION_TECNICA);

    // Validación de seguridad dura: credenciales o ADMIN solo para CT
    if (
      (!isAdmin && resource.visibility === ResourceVisibility.ADMIN) ||
      (!isAdmin && resource.type === ResourceType.CREDENCIAL)
    ) {
      throw new ForbiddenException(
        'Acceso restringido: no tienes permisos para visualizar este recurso.',
      );
    }

    return resource;
  }

  /**
   * Crea un nuevo recurso aplicando la regla de visibilidad forzada de Anexo A.5
   */
  async createResource(dto: CreateResourceDto, adminId: string) {
    // REGLA DURA Anexo A.5: Cuando type = CREDENCIAL, se fuerza incondicionalmente visibility = ADMIN
    let visibility = dto.visibility || ResourceVisibility.AUTHENTICATED;
    if (dto.type === ResourceType.CREDENCIAL) {
      visibility = ResourceVisibility.ADMIN;
    }

    const resource = await this.prisma.resource.create({
      data: {
        type: dto.type,
        title: dto.title.trim(),
        description: dto.description?.trim() || null,
        fileUrl: dto.fileUrl?.trim() || null,
        content: dto.content?.trim() || null,
        visibility,
        createdById: adminId,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // Auditoría
    await this.auditService.log({
      action: AuditAction.RESOURCE_CREATED,
      entityType: 'Resource',
      entityId: resource.id,
      userId: adminId,
      details: {
        type: resource.type,
        title: resource.title,
        visibility: resource.visibility,
      },
    });

    return resource;
  }

  /**
   * Actualiza un recurso aplicando la regla de visibilidad forzada de Anexo A.5
   */
  async updateResource(id: string, dto: UpdateResourceDto, adminId: string) {
    const existing = await this.prisma.resource.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Recurso con ID ${id} no encontrado`);
    }

    const nextType = dto.type || existing.type;
    let nextVisibility = dto.visibility !== undefined ? dto.visibility : existing.visibility;

    // REGLA DURA Anexo A.5: si el tipo es CREDENCIAL, siempre fuerza ADMIN
    if (nextType === ResourceType.CREDENCIAL) {
      nextVisibility = ResourceVisibility.ADMIN;
    }

    const updated = await this.prisma.resource.update({
      where: { id },
      data: {
        type: dto.type,
        title: dto.title ? dto.title.trim() : undefined,
        description: dto.description !== undefined ? dto.description?.trim() || null : undefined,
        fileUrl: dto.fileUrl !== undefined ? dto.fileUrl?.trim() || null : undefined,
        content: dto.content !== undefined ? dto.content?.trim() || null : undefined,
        visibility: nextVisibility,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // Auditoría
    await this.auditService.log({
      action: 'RESOURCE_UPDATED',
      entityType: 'Resource',
      entityId: updated.id,
      userId: adminId,
      details: {
        title: updated.title,
        type: updated.type,
        visibility: updated.visibility,
      },
    });

    return updated;
  }

  /**
   * Elimina un recurso del sistema (solo Comisión Técnica)
   */
  async deleteResource(id: string, adminId: string) {
    const existing = await this.prisma.resource.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Recurso con ID ${id} no encontrado`);
    }

    await this.prisma.resource.delete({
      where: { id },
    });

    await this.auditService.log({
      action: 'RESOURCE_DELETED',
      entityType: 'Resource',
      entityId: id,
      userId: adminId,
      details: {
        title: existing.title,
        type: existing.type,
      },
    });

    return {
      success: true,
      message: 'Recurso eliminado exitosamente.',
    };
  }

  /**
   * Exporta la grilla de asignaciones en formato tabular CSV con UTF-8 BOM compatible con Excel (RF20)
   */
  async exportNominationsCsv(dto: ExportNominationsDto) {
    const matchWhere: any = {};

    if (dto.startDate || dto.endDate) {
      matchWhere.matchDateTime = {};
      if (dto.startDate) {
        matchWhere.matchDateTime.gte = new Date(`${dto.startDate}T00:00:00.000Z`);
      }
      if (dto.endDate) {
        matchWhere.matchDateTime.lte = new Date(`${dto.endDate}T23:59:59.999Z`);
      }
    }

    if (dto.tournament && dto.tournament.trim()) {
      matchWhere.tournament = { contains: dto.tournament.trim(), mode: 'insensitive' };
    }

    if (dto.venue && dto.venue.trim()) {
      matchWhere.venue = { contains: dto.venue.trim(), mode: 'insensitive' };
    }

    const nominations = await this.prisma.nomination.findMany({
      where: {
        match: matchWhere,
      },
      include: {
        match: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: [
        { match: { matchDateTime: 'asc' } },
        { matchRole: 'asc' },
      ],
    });

    // Cabecera CSV
    const headers = [
      'Fecha',
      'Hora',
      'Bloque Horario',
      'Torneo',
      'Categoría',
      'Recinto / Gimnasio',
      'Equipo Local',
      'Equipo Visita',
      'Rol Asignado',
      'Personal Designado',
      'Email Contacto',
      'Teléfono Contacto',
      'Estado Designación',
      'Motivo Rechazo',
    ];

    const escapeCsv = (val: any): string => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = nominations.map((n) => {
      const matchDate = new Date(n.match.matchDateTime);
      const dateStr = matchDate.toISOString().split('T')[0];
      const timeStr = matchDate.toLocaleTimeString('es-CL', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'America/Santiago',
      });

      return [
        escapeCsv(dateStr),
        escapeCsv(timeStr),
        escapeCsv(n.match.timeBlock),
        escapeCsv(n.match.tournament),
        escapeCsv(n.match.category),
        escapeCsv(n.match.venue),
        escapeCsv(n.match.homeTeam),
        escapeCsv(n.match.awayTeam),
        escapeCsv(n.matchRole),
        escapeCsv(`${n.user.firstName} ${n.user.lastName}`),
        escapeCsv(n.user.email),
        escapeCsv(n.user.phone || 'N/A'),
        escapeCsv(n.status),
        escapeCsv(n.rejectionReason || ''),
      ].join(';');
    });

    // UTF-8 BOM (\uFEFF) para garantizar que Microsoft Excel abra las tildes y caracteres en español correctamente
    const bom = '\uFEFF';
    const csvContent = bom + [headers.map((h) => escapeCsv(h)).join(';'), ...rows].join('\r\n');

    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `grilla-asignaciones-sgaob-${timestamp}.csv`;

    return {
      filename,
      contentType: 'text/csv; charset=utf-8',
      csvContent,
      count: nominations.length,
    };
  }
}
