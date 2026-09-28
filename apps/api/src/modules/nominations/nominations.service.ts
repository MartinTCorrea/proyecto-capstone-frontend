import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../../common/audit/audit.service';
import { MailService } from '../../common/mail/mail.service';
import {
  AuditAction,
  MatchRole,
  NominationStatus,
  RoleName,
  UserStatus,
  AvailabilityBlock,
  MatchTimeBlock,
} from '@sgaob/shared';
import {
  CreateNominationDto,
  RespondNominationDto,
  QueryNominationsDto,
  QueryCandidatesDto,
} from './dto';

@Injectable()
export class NominationsService {
  private readonly logger = new Logger(NominationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly mailService: MailService,
  ) {}

  /**
   * Determina el rol de sistema obligatorio según el slot arbitral o de mesa (Anexo A.1)
   */
  private getRequiredSystemRole(matchRole: MatchRole): RoleName {
    if (
      matchRole === MatchRole.ARBITRO_PRINCIPAL ||
      matchRole === MatchRole.ARBITRO_1 ||
      matchRole === MatchRole.ARBITRO_2
    ) {
      return RoleName.ARBITRO;
    }
    return RoleName.OFICIAL_MESA;
  }

  /**
   * Comprueba si la disponibilidad horaria del usuario cubre el bloque del partido (RF12)
   */
  private checkAvailabilityMatch(
    userBlock: AvailabilityBlock | string,
    matchBlock: MatchTimeBlock | string,
  ): boolean {
    if (userBlock === AvailabilityBlock.FULL || userBlock === 'FULL') return true;
    if (userBlock === AvailabilityBlock.NO || userBlock === 'NO') return false;

    if (matchBlock === MatchTimeBlock.HORARIO_1 || matchBlock === 'HORARIO_1') {
      return userBlock === AvailabilityBlock.HORARIO_1 || userBlock === 'HORARIO_1';
    }
    if (matchBlock === MatchTimeBlock.HORARIO_2 || matchBlock === 'HORARIO_2') {
      return userBlock === AvailabilityBlock.HORARIO_2 || userBlock === 'HORARIO_2';
    }
    // Si el partido cubre AMBOS bloques, requiere FULL (ya evaluado arriba)
    return false;
  }

  /**
   * Obtiene la nómina de candidatos evaluando disponibilidad y acreditación para un slot (CU-07, Paso 2)
   */
  async getAvailableCandidates(query: QueryCandidatesDto) {
    const match = await this.prisma.match.findUnique({
      where: { id: query.matchId },
    });

    if (!match) {
      throw new NotFoundException(`Partido con ID ${query.matchId} no encontrado`);
    }

    const requiredRole = this.getRequiredSystemRole(query.matchRole);
    const matchDateOnly = new Date(`${match.matchDateTime.toISOString().split('T')[0]}T00:00:00.000Z`);

    // Inicio y fin del día para buscar solapamientos
    const startOfDay = new Date(matchDateOnly);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(matchDateOnly);
    endOfDay.setUTCHours(23, 59, 59, 999);

    // 1. Obtener todos los usuarios activos que poseen el rol técnico requerido (Anexo A.1)
    const candidates = await this.prisma.user.findMany({
      where: {
        status: UserStatus.ACTIVE,
        roles: {
          some: {
            role: { name: requiredRole },
          },
        },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        roles: {
          select: {
            role: { select: { name: true } },
          },
        },
      },
    });

    const candidateIds = candidates.map((c) => c.id);

    // 2. Consultar disponibilidad declarada por estos usuarios en la fecha del partido
    const availabilities = await this.prisma.availability.findMany({
      where: {
        userId: { in: candidateIds },
        date: matchDateOnly,
      },
    });

    // 3. Consultar asignaciones existentes en este mismo partido
    const currentMatchNominations = await this.prisma.nomination.findMany({
      where: {
        matchId: query.matchId,
        status: { not: NominationStatus.REJECTED },
      },
    });

    // 4. Consultar asignaciones de estos usuarios a otros partidos en el mismo día para detectar conflictos
    const otherNominationsOnDate = await this.prisma.nomination.findMany({
      where: {
        userId: { in: candidateIds },
        matchId: { not: query.matchId },
        match: {
          matchDateTime: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
        status: { not: NominationStatus.REJECTED },
      },
      include: {
        match: {
          select: {
            id: true,
            tournament: true,
            homeTeam: true,
            awayTeam: true,
            venue: true,
            timeBlock: true,
            matchDateTime: true,
          },
        },
      },
    });

    const availableCandidates: any[] = [];
    const unavailableCandidates: any[] = [];

    for (const candidate of candidates) {
      const avail = availabilities.find((a) => a.userId === candidate.id);
      const isAssignedToThisMatch = currentMatchNominations.some(
        (n) => n.userId === candidate.id && (!n.matchId || n.matchId === query.matchId),
      );

      // Evaluar conflicto horario con otro partido en el mismo bloque
      const conflictingNom = otherNominationsOnDate.find((n) => {
        if (n.userId !== candidate.id) return false;
        // Solapamiento si los bloques coinciden o alguno cubre AMBOS
        return (
          n.match.timeBlock === match.timeBlock ||
          n.match.timeBlock === MatchTimeBlock.AMBOS ||
          match.timeBlock === MatchTimeBlock.AMBOS
        );
      });

      const userBlock = avail ? avail.block : AvailabilityBlock.NO;
      const hasAvailability = this.checkAvailabilityMatch(userBlock, match.timeBlock);

      const candidateData = {
        ...candidate,
        roles: candidate.roles.map((r) => r.role.name),
        declaredBlock: userBlock,
        isAvailable: hasAvailability,
        isAssignedToThisMatch,
        hasConflict: !!conflictingNom,
        conflictDetail: conflictingNom
          ? `${conflictingNom.match.tournament}: ${conflictingNom.match.homeTeam} vs ${conflictingNom.match.awayTeam} (${conflictingNom.match.timeBlock})`
          : null,
      };

      if (hasAvailability && !isAssignedToThisMatch && !conflictingNom) {
        availableCandidates.push(candidateData);
      } else {
        let reason = 'Sin disponibilidad declarada para este bloque horario (RF12)';
        if (isAssignedToThisMatch) reason = 'Ya asignado a otro slot en este mismo partido';
        else if (conflictingNom) reason = `Conflicto de horario con otro partido asignado (${candidateData.conflictDetail})`;
        else if (userBlock === AvailabilityBlock.NO) reason = 'Declaró NO disponible para esta fecha';

        unavailableCandidates.push({
          ...candidateData,
          unavailableReason: reason,
        });
      }
    }

    return {
      match: {
        id: match.id,
        tournament: match.tournament,
        category: match.category,
        teams: `${match.homeTeam} vs ${match.awayTeam}`,
        venue: match.venue,
        matchDateTime: match.matchDateTime,
        timeBlock: match.timeBlock,
      },
      requestedSlot: query.matchRole,
      requiredSystemRole: requiredRole,
      counts: {
        available: availableCandidates.length,
        unavailable: unavailableCandidates.length,
        total: candidates.length,
      },
      availableCandidates,
      unavailableCandidates,
    };
  }

  /**
   * Crea una nueva nominación con validaciones duras de rol y disponibilidad (RF11, RF12, RF13, Anexo A.1)
   */
  async createNomination(dto: CreateNominationDto, adminId: string) {
    const match = await this.prisma.match.findUnique({
      where: { id: dto.matchId },
    });

    if (!match) {
      throw new NotFoundException(`Partido con ID ${dto.matchId} no encontrado`);
    }

    // 1. Validar que el slot no esté ocupado por una nominación activa
    const existingSlot = await this.prisma.nomination.findFirst({
      where: {
        matchId: dto.matchId,
        matchRole: dto.matchRole,
      },
    });

    if (existingSlot && existingSlot.status !== NominationStatus.REJECTED) {
      throw new ConflictException(
        `El slot ${dto.matchRole} ya se encuentra asignado a un usuario en este partido.`,
      );
    }

    // 2. Validar que el usuario no esté asignado en otro slot de este mismo partido
    const existingUserMatch = await this.prisma.nomination.findFirst({
      where: {
        matchId: dto.matchId,
        userId: dto.userId,
        status: { not: NominationStatus.REJECTED },
      },
    });

    if (existingUserMatch) {
      throw new ConflictException(
        'El usuario seleccionado ya posee un rol asignado en este mismo partido.',
      );
    }

    // 3. Validar perfil y estado del usuario
    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId },
      include: {
        roles: {
          include: { role: true },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`Usuario con ID ${dto.userId} no encontrado`);
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new BadRequestException('Solo se pueden nominar usuarios con estado ACTIVO en el sistema.');
    }

    // 4. Validación dura de rol técnico independiente (Anexo A.1)
    const requiredRole = this.getRequiredSystemRole(dto.matchRole);
    const hasRequiredRole = user.roles.some((r) => r.role.name === requiredRole);

    if (!hasRequiredRole) {
      const roleDescription =
        requiredRole === RoleName.ARBITRO ? 'Árbitro de campo' : 'Oficial de mesa técnica';
      throw new BadRequestException(
        `Validación de rol fallida (Anexo A.1): Para ser nominado a ${dto.matchRole}, el usuario DEBE tener la acreditación de ${roleDescription} (${requiredRole}).`,
      );
    }

    // 5. Validación de disponibilidad horaria (RF12)
    const matchDateOnly = new Date(`${match.matchDateTime.toISOString().split('T')[0]}T00:00:00.000Z`);
    const availability = await this.prisma.availability.findUnique({
      where: {
        userId_date: {
          userId: dto.userId,
          date: matchDateOnly,
        },
      },
    });

    const userBlock = availability ? availability.block : AvailabilityBlock.NO;
    const isAvailable = this.checkAvailabilityMatch(userBlock, match.timeBlock);

    if (!isAvailable) {
      if (!dto.overrideAvailability) {
        throw new BadRequestException(
          `El usuario no tiene disponibilidad declarada para este bloque horario (RF12). Bloque declarado: ${userBlock}, Requerido: ${match.timeBlock}. Para forzar asignación por excepción administrativa, active overrideAvailability con su motivo.`,
        );
      }

      if (!dto.overrideReason?.trim()) {
        throw new BadRequestException(
          'Debe especificar un motivo justificado para aplicar la excepción de disponibilidad.',
        );
      }

      // Registro de auditoría de la excepción administrativa
      await this.auditService.log({
        userId: adminId,
        action: AuditAction.NOMINATION_OVERRIDDEN,
        entityType: 'Nomination',
        entityId: match.id,
        details: {
          userId: dto.userId,
          matchId: dto.matchId,
          matchRole: dto.matchRole,
          overrideReason: dto.overrideReason,
        },
      });
    }

    // 6. Si existía una nominación previa rechazada en este slot, eliminarla para liberar la restricción única
    if (existingSlot) {
      await this.prisma.nomination.delete({
        where: { id: existingSlot.id },
      });
    }

    // 7. Crear la nominación en base de datos
    const nomination = await this.prisma.nomination.create({
      data: {
        matchId: dto.matchId,
        userId: dto.userId,
        matchRole: dto.matchRole,
        status: NominationStatus.PENDING,
        notifiedAt: new Date(),
      },
      include: {
        match: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    // 8. Notificación formal de nominación por correo electrónico (RF14)
    if (user.email) {
      await this.mailService.sendNominationAlert({
        to: user.email,
        userId: user.id,
        refereeName: `${user.firstName} ${user.lastName}`,
        tournament: match.tournament,
        category: match.category,
        homeTeam: match.homeTeam,
        awayTeam: match.awayTeam,
        venue: match.venue,
        matchDateTime: match.matchDateTime,
        matchRole: dto.matchRole,
      });
    }

    // 9. Registro de auditoría
    await this.auditService.log({
      userId: adminId,
      action: AuditAction.NOMINATION_CREATED,
      entityType: 'Nomination',
      entityId: nomination.id,
      details: {
        matchId: nomination.matchId,
        userId: nomination.userId,
        matchRole: nomination.matchRole,
        tournament: match.tournament,
      },
    });

    this.logger.log(
      `Nominación creada: Usuario ${user.firstName} ${user.lastName} asignado como ${dto.matchRole} en partido ${match.id}`,
    );

    return nomination;
  }

  /**
   * Responde formalmente a una nominación: Confirmar o Rechazar con motivo (RF15)
   */
  async respondNomination(
    id: string,
    dto: RespondNominationDto,
    currentUserId: string,
    isAdmin: boolean,
  ) {
    const nomination = await this.prisma.nomination.findUnique({
      where: { id },
      include: {
        match: true,
        user: true,
      },
    });

    if (!nomination) {
      throw new NotFoundException(`Nominación con ID ${id} no encontrada`);
    }

    // Validar autorización: Solo el usuario nominado o la Comisión Técnica pueden responder
    if (!isAdmin && nomination.userId !== currentUserId) {
      throw new ForbiddenException('No estás autorizado para responder una nominación asignada a otro usuario.');
    }

    if (dto.status === NominationStatus.REJECTED && !dto.rejectionReason?.trim()) {
      throw new BadRequestException('Es obligatorio proporcionar un motivo justificado al rechazar una nominación (RF15).');
    }

    const updated = await this.prisma.nomination.update({
      where: { id },
      data: {
        status: dto.status,
        rejectionReason: dto.status === NominationStatus.REJECTED ? dto.rejectionReason?.trim() : null,
        respondedAt: new Date(),
      },
      include: {
        match: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    await this.auditService.log({
      userId: currentUserId,
      action: AuditAction.NOMINATION_STATUS_CHANGED,
      entityType: 'Nomination',
      entityId: id,
      details: {
        previousStatus: nomination.status,
        newStatus: updated.status,
        rejectionReason: updated.rejectionReason,
      },
    });

    this.logger.log(`Nominación ${id} actualizada a estado: ${updated.status}`);
    return updated;
  }

  /**
   * Consulta listado de nominaciones con filtros y paginación
   */
  async getNominations(
    query: QueryNominationsDto,
    currentUserId: string,
    userRoles: RoleName[],
  ) {
    const isCT = userRoles.includes(RoleName.ADMIN_COMISION_TECNICA);
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.matchId) where.matchId = query.matchId;
    if (query.userId) where.userId = query.userId;
    if (query.status) where.status = query.status;
    if (query.matchRole) where.matchRole = query.matchRole;

    // Filtros por datos del partido relacionado
    if (query.startDate || query.endDate || query.tournament || query.venue) {
      where.match = {};
      if (query.startDate || query.endDate) {
        where.match.matchDateTime = {};
        if (query.startDate) where.match.matchDateTime.gte = new Date(query.startDate);
        if (query.endDate) where.match.matchDateTime.lte = new Date(query.endDate);
      }
      if (query.tournament) {
        where.match.tournament = { contains: query.tournament, mode: 'insensitive' };
      }
      if (query.venue) {
        where.match.venue = { contains: query.venue, mode: 'insensitive' };
      }
    }

    const [total, data] = await Promise.all([
      this.prisma.nomination.count({ where }),
      this.prisma.nomination.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          match: true,
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
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
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Obtiene detalle de una nominación por ID
   */
  async getNominationById(id: string) {
    const nomination = await this.prisma.nomination.findUnique({
      where: { id },
      include: {
        match: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!nomination) {
      throw new NotFoundException(`Nominación con ID ${id} no encontrada`);
    }

    return nomination;
  }

  /**
   * Desasigna o revoca una nominación liberando el slot (Comisión Técnica)
   */
  async deleteNomination(id: string, adminId: string) {
    const nomination = await this.prisma.nomination.findUnique({
      where: { id },
      include: { match: true, user: true },
    });

    if (!nomination) {
      throw new NotFoundException(`Nominación con ID ${id} no encontrada`);
    }

    await this.prisma.nomination.delete({ where: { id } });

    await this.auditService.log({
      userId: adminId,
      action: 'NOMINATION_REVOKED',
      entityType: 'Nomination',
      entityId: id,
      details: {
        matchId: nomination.matchId,
        userId: nomination.userId,
        matchRole: nomination.matchRole,
        referee: `${nomination.user.firstName} ${nomination.user.lastName}`,
      },
    });

    return { success: true, message: 'Nominación revocada exitosamente' };
  }
}
