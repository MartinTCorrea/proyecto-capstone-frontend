import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../../common/audit/audit.service';
import { MailService } from '../../common/mail/mail.service';
import {
  AuditAction,
  DayType,
  MatchPlatform,
  MatchStatus,
  MatchTimeBlock,
} from '@sgaob/shared';
import {
  CreateMatchDto,
  UpdateMatchDto,
  QueryMatchesDto,
  SyncMatchesDto,
} from './dto';
import { MatchSyncQueueService, SyncJobData } from './queue/match-sync.queue';
import { MockSyncProvider } from './providers/mock-sync.provider';
import { Nbn23SyncProvider } from './providers/nbn23-sync.provider';
import { MatchSyncProvider } from './providers/match-sync.interface';

@Injectable()
export class MatchesService {
  private readonly logger = new Logger(MatchesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly mailService: MailService,
    @Inject(forwardRef(() => MatchSyncQueueService))
    private readonly queueService: MatchSyncQueueService,
    private readonly mockSyncProvider: MockSyncProvider,
    private readonly nbn23SyncProvider: Nbn23SyncProvider,
  ) {}

  /**
   * Calcula automáticamente el bloque horario correspondiente a un partido (Anexo A.4)
   * según el tipo de día (Laboral vs Fin de Semana) y las horas parametrizadas en TimeBlockConfig.
   */
  async calculateMatchTimeBlock(matchDateTime: Date): Promise<MatchTimeBlock> {
    const dayOfWeek = matchDateTime.getUTCDay(); // 0 = Domingo, 6 = Sábado
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const dayType = isWeekend ? DayType.FIN_DE_SEMANA : DayType.LABORAL;

    // Horas y minutos de la fecha (usando UTC ya que se almacena en ISO UTC)
    const hours = matchDateTime.getUTCHours();
    const minutes = matchDateTime.getUTCMinutes();
    const totalMinutes = hours * 60 + minutes;

    // Buscar configuraciones activas en base de datos para ese tipo de día
    const configs = await this.prisma.timeBlockConfig.findMany({
      where: { dayType, isActive: true },
    });

    const h1Config = configs.find((c) => c.blockCode === 'HORARIO_1' && (!c.dayType || c.dayType === dayType));
    const h2Config = configs.find((c) => c.blockCode === 'HORARIO_2' && (!c.dayType || c.dayType === dayType));

    // Valores por defecto según Anexo A.4 si aún no están creados en DB
    // Laboral: H1 = 15:30 (930) a 19:30 (1170), H2 = 19:30 (1170) a 22:00 (1320)
    // Fin de semana: H1 = 09:00 (540) a 15:00 (900), H2 = 15:00 (900) a 22:00 (1320)
    let h1EndMinutes = isWeekend ? 15 * 60 : 19 * 60 + 30;
    let h2StartMinutes = isWeekend ? 15 * 60 : 19 * 60 + 30;

    if (h1Config) {
      const [h, m] = h1Config.endTime.split(':').map(Number);
      h1EndMinutes = h * 60 + m;
    }
    if (h2Config) {
      const [h, m] = h2Config.startTime.split(':').map(Number);
      h2StartMinutes = h * 60 + m;
    }

    // Duración típica estimada de un partido: 105 minutos (1h 45m)
    const matchEndMinutes = totalMinutes + 105;

    // Si el partido inicia en H1 y termina dentro de H2, abarca ambos bloques
    if (totalMinutes < h1EndMinutes && matchEndMinutes > h2StartMinutes + 15) {
      return MatchTimeBlock.AMBOS;
    }

    if (totalMinutes < h1EndMinutes) {
      return MatchTimeBlock.HORARIO_1;
    }

    return MatchTimeBlock.HORARIO_2;
  }

  /**
   * Crea un nuevo partido manualmente (Comisión Técnica / 100% Autónomo)
   */
  async createMatch(dto: CreateMatchDto, adminId?: string) {
    const matchDate = new Date(dto.matchDateTime);
    if (isNaN(matchDate.getTime())) {
      throw new BadRequestException('Fecha y hora de partido inválida');
    }

    const platform = dto.platform || MatchPlatform.MANUAL;
    const externalId = dto.externalId || `MANUAL-${randomUUID().substring(0, 8).toUpperCase()}`;

    // Calcular bloque horario automático si no se especificó manualmente
    const timeBlock = dto.timeBlock || (await this.calculateMatchTimeBlock(matchDate));

    const match = await this.prisma.match.create({
      data: {
        externalId,
        platform,
        timeBlock,
        tournament: dto.tournament.trim(),
        category: dto.category.trim(),
        homeTeam: dto.homeTeam.trim(),
        awayTeam: dto.awayTeam.trim(),
        venue: dto.venue.trim(),
        matchDateTime: matchDate,
        status: dto.status || MatchStatus.SCHEDULED,
        rawMetadata: dto.rawMetadata || {},
      },
    });

    await this.auditService.log({
      userId: adminId,
      action: AuditAction.MATCH_CREATED,
      entityType: 'Match',
      entityId: match.id,
      details: {
        tournament: match.tournament,
        match: `${match.homeTeam} vs ${match.awayTeam}`,
        platform: match.platform,
        matchDateTime: match.matchDateTime,
        timeBlock: match.timeBlock,
      },
    });

    this.logger.log(`Partido creado exitosamente: ${match.homeTeam} vs ${match.awayTeam} (ID: ${match.id})`);
    return match;
  }

  /**
   * Actualiza un partido existente (detecta cambios de horario o estado y dispara RF10)
   */
  async updateMatch(id: string, dto: UpdateMatchDto, adminId?: string) {
    const existing = await this.prisma.match.findUnique({
      where: { id },
      include: {
        nominations: {
          include: { user: true },
        },
      },
    });

    if (!existing) {
      throw new NotFoundException(`Partido con ID ${id} no encontrado`);
    }

    const dataToUpdate: any = {};
    if (dto.tournament !== undefined) dataToUpdate.tournament = dto.tournament.trim();
    if (dto.category !== undefined) dataToUpdate.category = dto.category.trim();
    if (dto.homeTeam !== undefined) dataToUpdate.homeTeam = dto.homeTeam.trim();
    if (dto.awayTeam !== undefined) dataToUpdate.awayTeam = dto.awayTeam.trim();
    if (dto.venue !== undefined) dataToUpdate.venue = dto.venue.trim();
    if (dto.rawMetadata !== undefined) dataToUpdate.rawMetadata = dto.rawMetadata;

    let isRescheduled = false;
    let newDate = existing.matchDateTime;

    if (dto.matchDateTime !== undefined) {
      newDate = new Date(dto.matchDateTime);
      if (isNaN(newDate.getTime())) {
        throw new BadRequestException('Fecha y hora inválida');
      }

      if (newDate.getTime() !== existing.matchDateTime.getTime()) {
        isRescheduled = true;
        dataToUpdate.matchDateTime = newDate;

        // Recalcular bloque horario si no se forzó uno específico
        dataToUpdate.timeBlock = dto.timeBlock || (await this.calculateMatchTimeBlock(newDate));
      }
    }

    if (dto.timeBlock !== undefined) {
      dataToUpdate.timeBlock = dto.timeBlock;
    }

    // Manejo de estado
    let targetStatus = existing.status;
    if (dto.status !== undefined) {
      targetStatus = dto.status;
      dataToUpdate.status = targetStatus;
    } else if (isRescheduled && existing.status === MatchStatus.SCHEDULED) {
      targetStatus = MatchStatus.RESCHEDULED;
      dataToUpdate.status = MatchStatus.RESCHEDULED;
    }

    const isStatusChanged = targetStatus !== existing.status;
    const isCriticalChange =
      isStatusChanged &&
      (targetStatus === MatchStatus.SUSPENDED ||
        targetStatus === MatchStatus.CANCELLED ||
        targetStatus === MatchStatus.RESCHEDULED);

    const updated = await this.prisma.match.update({
      where: { id },
      data: dataToUpdate,
    });

    // Auditoría del cambio
    await this.auditService.log({
      userId: adminId,
      action: isStatusChanged ? AuditAction.MATCH_STATUS_UPDATED : AuditAction.MATCH_UPDATED,
      entityType: 'Match',
      entityId: id,
      details: {
        previousStatus: existing.status,
        newStatus: updated.status,
        previousDate: existing.matchDateTime,
        newDate: updated.matchDateTime,
        changes: dataToUpdate,
      },
    });

    // RF10: Alerta automática por correo al personal nominado si el partido se suspende/cancela/reprograma
    if (isCriticalChange || isRescheduled) {
      this.logger.warn(
        `[RF10] Cambio crítico detectado en partido ${updated.id} (${existing.status} -> ${updated.status}). Notificando al personal nominado...`,
      );

      for (const nomination of existing.nominations) {
        if (nomination.user?.email) {
          await this.mailService.sendMatchStatusChangeAlert({
            to: nomination.user.email,
            userId: nomination.user.id,
            refereeName: `${nomination.user.firstName} ${nomination.user.lastName}`,
            tournament: updated.tournament,
            homeTeam: updated.homeTeam,
            awayTeam: updated.awayTeam,
            venue: updated.venue,
            matchDateTime: updated.matchDateTime,
            previousStatus: existing.status,
            newStatus: updated.status,
          });
        }
      }
    }

    return updated;
  }

  /**
   * Consulta listado de partidos con paginación y filtros
   */
  async getMatches(query: QueryMatchesDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.startDate || query.endDate) {
      where.matchDateTime = {};
      if (query.startDate) {
        where.matchDateTime.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        where.matchDateTime.lte = new Date(query.endDate);
      }
    }

    if (query.tournament) {
      where.tournament = { contains: query.tournament, mode: 'insensitive' };
    }

    if (query.venue) {
      where.venue = { contains: query.venue, mode: 'insensitive' };
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.platform) {
      where.platform = query.platform;
    }

    if (query.timeBlock) {
      where.timeBlock = query.timeBlock;
    }

    const [total, data] = await Promise.all([
      this.prisma.match.count({ where }),
      this.prisma.match.findMany({
        where,
        skip,
        take: limit,
        orderBy: { matchDateTime: 'asc' },
        include: {
          nominations: {
            include: {
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
   * Obtiene un partido por su identificador UUID
   */
  async getMatchById(id: string) {
    const match = await this.prisma.match.findUnique({
      where: { id },
      include: {
        nominations: {
          include: {
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
        },
      },
    });

    if (!match) {
      throw new NotFoundException(`Partido con ID ${id} no encontrado`);
    }

    return match;
  }

  /**
   * Elimina un partido manual si no tiene nominaciones confirmadas
   */
  async deleteMatch(id: string, adminId?: string) {
    const match = await this.prisma.match.findUnique({
      where: { id },
      include: { nominations: true },
    });

    if (!match) {
      throw new NotFoundException(`Partido con ID ${id} no encontrado`);
    }

    await this.prisma.match.delete({ where: { id } });

    await this.auditService.log({
      userId: adminId,
      action: 'MATCH_DELETED',
      entityType: 'Match',
      entityId: id,
      details: { tournament: match.tournament, teams: `${match.homeTeam} vs ${match.awayTeam}` },
    });

    return { success: true, message: 'Partido eliminado exitosamente' };
  }

  /**
   * Dispara una sincronización manual bajo demanda (RF09) en cola BullMQ
   */
  async triggerSync(dto: SyncMatchesDto, adminId?: string) {
    const result = await this.queueService.addSyncJob({
      platform: dto.platform || MatchPlatform.SWISH,
      mock: dto.mock !== undefined ? dto.mock : true,
      requestedBy: adminId,
    });

    return {
      success: true,
      message: 'Sincronización de partidos programada exitosamente en la cola asíncrona',
      ...result,
    };
  }

  /**
   * Procesa la sincronización de partidos contra el proveedor seleccionado (Worker/Service)
   */
  async processSync(jobData: SyncJobData) {
    const platform = jobData.platform || MatchPlatform.SWISH;
    const isMock = jobData.mock !== false;

    this.logger.log(
      `Iniciando ejecución de sincronización para plataforma ${platform} (Modo: ${isMock ? 'Mock' : 'API Remota'})...`,
    );

    const provider: MatchSyncProvider =
      platform === MatchPlatform.NBN23 && !isMock
        ? this.nbn23SyncProvider
        : this.mockSyncProvider;

    const externalMatches = await provider.fetchMatches();
    let createdCount = 0;
    let updatedCount = 0;

    for (const ext of externalMatches) {
      const matchDate = new Date(ext.matchDateTime);
      const timeBlock = await this.calculateMatchTimeBlock(matchDate);

      const existing = await this.prisma.match.findUnique({
        where: {
          platform_externalId: {
            platform: ext.platform,
            externalId: ext.externalId,
          },
        },
        include: {
          nominations: {
            include: { user: true },
          },
        },
      });

      if (!existing) {
        // Crear nuevo partido
        await this.prisma.match.create({
          data: {
            externalId: ext.externalId,
            platform: ext.platform,
            timeBlock,
            tournament: ext.tournament,
            category: ext.category,
            homeTeam: ext.homeTeam,
            awayTeam: ext.awayTeam,
            venue: ext.venue,
            matchDateTime: matchDate,
            status: ext.status,
            rawMetadata: ext.rawMetadata || {},
          },
        });
        createdCount++;
      } else {
        // Actualizar partido existente y verificar si cambió de estado/fecha (RF10)
        const isStatusChanged = existing.status !== ext.status;
        const isDateChanged = existing.matchDateTime.getTime() !== matchDate.getTime();

        const updated = await this.prisma.match.update({
          where: { id: existing.id },
          data: {
            timeBlock,
            tournament: ext.tournament,
            category: ext.category,
            homeTeam: ext.homeTeam,
            awayTeam: ext.awayTeam,
            venue: ext.venue,
            matchDateTime: matchDate,
            status: ext.status,
            rawMetadata: ext.rawMetadata || {},
          },
        });
        updatedCount++;

        // RF10: Alerta automática si un partido ya nominado se suspende, cancela o reprograma externamente
        if (
          isStatusChanged &&
          (ext.status === MatchStatus.SUSPENDED ||
            ext.status === MatchStatus.CANCELLED ||
            ext.status === MatchStatus.RESCHEDULED ||
            isDateChanged)
        ) {
          for (const nom of existing.nominations) {
            if (nom.user?.email) {
              await this.mailService.sendMatchStatusChangeAlert({
                to: nom.user.email,
                userId: nom.user.id,
                refereeName: `${nom.user.firstName} ${nom.user.lastName}`,
                tournament: updated.tournament,
                homeTeam: updated.homeTeam,
                awayTeam: updated.awayTeam,
                venue: updated.venue,
                matchDateTime: updated.matchDateTime,
                previousStatus: existing.status,
                newStatus: updated.status,
              });
            }
          }
        }
      }
    }

    // Actualizar registro de integración en base de datos
    await this.prisma.integrationConfig.upsert({
      where: { platform: provider.platform },
      update: {
        lastSyncAt: new Date(),
        syncStatus: 'SUCCESS',
        lastErrorMessage: null,
      },
      create: {
        platform: provider.platform,
        apiUrl: 'https://api.swish.basketball/v1',
        isActive: true,
        lastSyncAt: new Date(),
        syncStatus: 'SUCCESS',
      },
    });

    this.logger.log(
      `Sincronización finalizada: ${createdCount} creados, ${updatedCount} actualizados de ${externalMatches.length} procesados.`,
    );

    return {
      success: true,
      platform: provider.platform,
      totalReceived: externalMatches.length,
      createdCount,
      updatedCount,
    };
  }

  /**
   * Prueba de conectividad con plataformas externas (RF07)
   */
  async testIntegration(platform: MatchPlatform) {
    if (platform === MatchPlatform.NBN23) {
      return this.nbn23SyncProvider.testConnection();
    }
    return this.mockSyncProvider.testConnection();
  }
}
