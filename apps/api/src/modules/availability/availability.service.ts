import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../../common/audit/audit.service';
import { AuditAction, RoleName, UserStatus } from '@sgaob/shared';
import {
  DeclareAvailabilityBulkDto,
  QueryAvailabilityDto,
  QueryAvailabilitySummaryDto,
  UpdateTimeBlockDto,
} from './dto';

/**
 * Calcula la fecha y hora límite (Miércoles 23:59:59) para la semana correspondiente a una fecha objetivo (RF05).
 */
export function getDeadlineForDate(dateStr: string): Date {
  const target = new Date(`${dateStr.split('T')[0]}T00:00:00.000Z`);
  const dayOfWeek = target.getUTCDay(); // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(target);
  monday.setUTCDate(target.getUTCDate() + diffToMonday);

  const wednesday = new Date(monday);
  wednesday.setUTCDate(monday.getUTCDate() + 2);
  wednesday.setUTCHours(23, 59, 59, 999);
  return wednesday;
}

export function parseDateOnly(dateStr: string): Date {
  return new Date(`${dateStr.split('T')[0]}T00:00:00.000Z`);
}

@Injectable()
export class AvailabilityService {
  private readonly logger = new Logger(AvailabilityService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Obtiene la configuración de bloques horarios parametrizados (Anexo A.4)
   */
  async getTimeBlocks() {
    return this.prisma.timeBlockConfig.findMany({
      where: { isActive: true },
      orderBy: [{ dayType: 'asc' }, { blockCode: 'asc' }],
    });
  }

  /**
   * Actualiza los límites de un bloque horario parametrizado (Anexo A.4, Comisión Técnica)
   */
  async updateTimeBlock(id: string, dto: UpdateTimeBlockDto, adminId: string) {
    const existing = await this.prisma.timeBlockConfig.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Bloque horario con ID ${id} no encontrado`);
    }

    if (dto.startTime && dto.endTime && dto.startTime >= dto.endTime) {
      throw new BadRequestException('La hora de inicio debe ser anterior a la hora de fin');
    }

    const updated = await this.prisma.timeBlockConfig.update({
      where: { id },
      data: {
        ...(dto.startTime && { startTime: dto.startTime }),
        ...(dto.endTime && { endTime: dto.endTime }),
        ...(dto.description !== undefined && { description: dto.description }),
      },
    });

    await this.auditService.log({
      userId: adminId,
      action: AuditAction.USER_UPDATED,
      entityType: 'TimeBlockConfig',
      entityId: id,
      details: { previous: existing, updated: dto },
    });

    this.logger.log(`Bloque horario ${updated.blockCode} (${updated.dayType}) actualizado por Admin ${adminId}`);
    return updated;
  }

  /**
   * Consulta la disponibilidad declarada por el usuario autenticado (RF06)
   */
  async getMyAvailability(userId: string, query?: QueryAvailabilityDto) {
    const where: any = { userId };

    if (query?.startDate || query?.endDate) {
      where.date = {};
      if (query.startDate) {
        where.date.gte = parseDateOnly(query.startDate);
      }
      if (query.endDate) {
        where.date.lte = parseDateOnly(query.endDate);
      }
    }

    const records = await this.prisma.availability.findMany({
      where,
      orderBy: { date: 'asc' },
    });

    return records.map((r) => ({
      id: r.id,
      userId: r.userId,
      date: r.date.toISOString().split('T')[0],
      block: r.block,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));
  }

  /**
   * Declaración masiva semanal de disponibilidad (RF04, RF05)
   * Valida la regla de cierre de plazo (Miércoles 23:59), salvo que un Admin autorice override.
   */
  async declareBulk(
    userId: string,
    dto: DeclareAvailabilityBulkDto,
    isBypassDeadline = false,
  ) {
    const now = new Date();

    // 1. Validar reglas de plazo (RF05)
    for (const item of dto.availabilities) {
      const targetDate = parseDateOnly(item.date);
      const deadline = getDeadlineForDate(item.date);

      if (!isBypassDeadline) {
        // Si la fecha objetivo ya pasó o el plazo de miércoles 23:59 ya venció
        if (targetDate.getTime() < now.setHours(0, 0, 0, 0) || new Date().getTime() > deadline.getTime()) {
          throw new BadRequestException(
            `El plazo para declarar disponibilidad para la fecha ${item.date} venció el miércoles previo a las 23:59 (RF05). Contacte a la Comisión Técnica para casos justificados.`,
          );
        }
      }
    }

    // 2. Transacción de inserción/actualización atómica (upsert)
    const results = await this.prisma.$transaction(async (tx) => {
      const upserted = [];

      for (const item of dto.availabilities) {
        const targetDate = parseDateOnly(item.date);

        const record = await tx.availability.upsert({
          where: {
            userId_date: {
              userId,
              date: targetDate,
            },
          },
          update: {
            block: item.block,
          },
          create: {
            userId,
            date: targetDate,
            block: item.block,
          },
        });

        upserted.push({
          id: record.id,
          userId: record.userId,
          date: record.date.toISOString().split('T')[0],
          block: record.block,
        });
      }

      return upserted;
    });

    // 3. Auditoría inmutable
    await this.auditService.log({
      userId,
      action: AuditAction.AVAILABILITY_SUBMITTED,
      entityType: 'Availability',
      entityId: userId,
      details: {
        entriesCount: dto.availabilities.length,
        isBypassDeadline,
        entries: dto.availabilities,
      },
    });

    this.logger.log(
      `Disponibilidad declarada para usuario ${userId}: ${dto.availabilities.length} fechas registradas`,
    );

    return results;
  }

  /**
   * Consulta consolidada de disponibilidad para la Comisión Técnica (RF06)
   * Permite filtrar por fecha, bloque y rol técnico para programar designaciones.
   */
  async getAvailabilitySummary(query: QueryAvailabilitySummaryDto) {
    const targetDate = parseDateOnly(query.date);

    const where: any = {
      date: targetDate,
      user: {
        status: UserStatus.ACTIVE,
      },
    };

    if (query.block) {
      where.block = query.block;
    }

    if (query.role) {
      where.user.roles = {
        some: {
          role: {
            name: query.role,
          },
        },
      };
    }

    const availabilities = await this.prisma.availability.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            status: true,
            roles: {
              include: {
                role: true,
              },
            },
          },
        },
      },
      orderBy: [
        { block: 'asc' },
        { user: { lastName: 'asc' } },
      ],
    });

    // Agrupación y conteos por bloque
    const summaryByBlock = {
      HORARIO_1: 0,
      HORARIO_2: 0,
      FULL: 0,
      NO: 0,
    };

    const details = availabilities.map((a) => {
      summaryByBlock[a.block] = (summaryByBlock[a.block] || 0) + 1;
      const userRoles = a.user.roles.map((ur) => ur.role.name);

      return {
        availabilityId: a.id,
        userId: a.user.id,
        fullName: `${a.user.firstName} ${a.user.lastName}`,
        email: a.user.email,
        phone: a.user.phone,
        block: a.block,
        roles: userRoles,
      };
    });

    return {
      date: query.date,
      totalAvailable: availabilities.length,
      counts: summaryByBlock,
      personnel: details,
    };
  }
}
