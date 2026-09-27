import { Test, TestingModule } from '@nestjs/testing';
import { MatchesService } from './matches.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../../common/audit/audit.service';
import { MailService } from '../../common/mail/mail.service';
import { MatchSyncQueueService } from './queue/match-sync.queue';
import { MockSyncProvider } from './providers/mock-sync.provider';
import { Nbn23SyncProvider } from './providers/nbn23-sync.provider';
import {
  MatchPlatform,
  MatchStatus,
  MatchTimeBlock,
  DayType,
  AuditAction,
} from '@sgaob/shared';
import { NotFoundException } from '@nestjs/common';

describe('MatchesService', () => {
  let service: MatchesService;
  let prisma: any;
  let auditService: any;
  let mailService: any;
  let queueService: any;
  let mockSyncProvider: any;

  beforeEach(async () => {
    prisma = {
      timeBlockConfig: {
        findMany: jest.fn().mockResolvedValue([
          { blockCode: 'HORARIO_1', startTime: '15:30', endTime: '19:30', dayType: DayType.LABORAL, isActive: true },
          { blockCode: 'HORARIO_2', startTime: '19:30', endTime: '22:00', dayType: DayType.LABORAL, isActive: true },
          { blockCode: 'HORARIO_1', startTime: '09:00', endTime: '15:00', dayType: DayType.FIN_DE_SEMANA, isActive: true },
          { blockCode: 'HORARIO_2', startTime: '15:00', endTime: '22:00', dayType: DayType.FIN_DE_SEMANA, isActive: true },
        ]),
      },
      match: {
        create: jest.fn(),
        update: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        delete: jest.fn(),
      },
      nomination: {
        findMany: jest.fn(),
      },
      integrationConfig: {
        upsert: jest.fn(),
      },
    };

    auditService = {
      log: jest.fn().mockResolvedValue(undefined),
    };

    mailService = {
      sendMatchStatusChangeAlert: jest.fn().mockResolvedValue({ success: true }),
    };

    queueService = {
      addSyncJob: jest.fn().mockResolvedValue({ jobId: 'job-123', status: 'ENQUEUED' }),
    };

    mockSyncProvider = {
      platform: MatchPlatform.SWISH,
      testConnection: jest.fn().mockResolvedValue({ success: true, message: 'OK' }),
      fetchMatches: jest.fn().mockResolvedValue([
        {
          externalId: 'EXT-1',
          platform: MatchPlatform.SWISH,
          tournament: 'LNB Chile',
          category: 'Adulto Varones',
          homeTeam: 'Catolica',
          awayTeam: 'Leones',
          venue: 'Estadio Palestino',
          matchDateTime: new Date('2026-10-14T19:30:00.000Z'),
          status: MatchStatus.SCHEDULED,
        },
      ]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MatchesService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: auditService },
        { provide: MailService, useValue: mailService },
        { provide: MatchSyncQueueService, useValue: queueService },
        { provide: MockSyncProvider, useValue: mockSyncProvider },
        {
          provide: Nbn23SyncProvider,
          useValue: {
            platform: MatchPlatform.NBN23,
            testConnection: jest.fn().mockResolvedValue({ success: true }),
            fetchMatches: jest.fn().mockResolvedValue([]),
          },
        },
      ],
    }).compile();

    service = module.get<MatchesService>(MatchesService);
  });

  describe('calculateMatchTimeBlock (Anexo A.4)', () => {
    it('debe clasificar como HORARIO_1 un partido en día hábil a las 16:30 UTC', async () => {
      // 2026-10-14 es un Miércoles (día hábil)
      const date = new Date('2026-10-14T16:30:00.000Z');
      const block = await service.calculateMatchTimeBlock(date);
      expect(block).toBe(MatchTimeBlock.HORARIO_1);
    });

    it('debe clasificar como HORARIO_2 un partido en día hábil a las 20:00 UTC', async () => {
      // 2026-10-14 Miércoles a las 20:00
      const date = new Date('2026-10-14T20:00:00.000Z');
      const block = await service.calculateMatchTimeBlock(date);
      expect(block).toBe(MatchTimeBlock.HORARIO_2);
    });

    it('debe clasificar como HORARIO_1 un partido en fin de semana a las 11:00 UTC', async () => {
      // 2026-10-17 es un Sábado
      const date = new Date('2026-10-17T11:00:00.000Z');
      const block = await service.calculateMatchTimeBlock(date);
      expect(block).toBe(MatchTimeBlock.HORARIO_1);
    });

    it('debe clasificar como HORARIO_2 un partido en fin de semana a las 16:00 UTC', async () => {
      // 2026-10-17 Sábado a las 16:00
      const date = new Date('2026-10-17T16:00:00.000Z');
      const block = await service.calculateMatchTimeBlock(date);
      expect(block).toBe(MatchTimeBlock.HORARIO_2);
    });
  });

  describe('createMatch (Autonomía / platform: MANUAL)', () => {
    it('debe crear un partido manual con ID generado y registrar en AuditLog', async () => {
      const matchDate = '2026-10-14T20:00:00.000Z';
      const createdRecord = {
        id: 'match-uuid-1',
        externalId: 'MANUAL-ABCD1234',
        platform: MatchPlatform.MANUAL,
        timeBlock: MatchTimeBlock.HORARIO_2,
        tournament: 'Copa Soprole Básquetbol',
        category: 'Sub-18 Varones',
        homeTeam: 'Colegio Los Leones',
        awayTeam: 'Boston College',
        venue: 'Gimnasio San Bernardo',
        matchDateTime: new Date(matchDate),
        status: MatchStatus.SCHEDULED,
      };

      prisma.match.create.mockResolvedValue(createdRecord);

      const result = await service.createMatch(
        {
          tournament: 'Copa Soprole Básquetbol',
          category: 'Sub-18 Varones',
          homeTeam: 'Colegio Los Leones',
          awayTeam: 'Boston College',
          venue: 'Gimnasio San Bernardo',
          matchDateTime: matchDate,
        },
        'admin-user-id',
      );

      expect(result).toEqual(createdRecord);
      expect(prisma.match.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            platform: MatchPlatform.MANUAL,
            timeBlock: MatchTimeBlock.HORARIO_2,
            homeTeam: 'Colegio Los Leones',
          }),
        }),
      );
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.MATCH_CREATED,
          userId: 'admin-user-id',
        }),
      );
    });
  });

  describe('updateMatch & RF10 Alerta Automática', () => {
    it('debe lanzar NotFoundException si el partido no existe', async () => {
      prisma.match.findUnique.mockResolvedValue(null);

      await expect(
        service.updateMatch('non-existent', { venue: 'Nuevo Recinto' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('debe actualizar el recinto sin disparar alertas si no cambia fecha ni estado crítico', async () => {
      const existing = {
        id: 'match-1',
        status: MatchStatus.SCHEDULED,
        matchDateTime: new Date('2026-10-14T19:30:00.000Z'),
        tournament: 'LNB',
        homeTeam: 'Catolica',
        awayTeam: 'Leones',
        venue: 'Viejo Recinto',
        nominations: [],
      };

      prisma.match.findUnique.mockResolvedValue(existing);
      prisma.match.update.mockResolvedValue({ ...existing, venue: 'Nuevo Gimnasio' });

      const updated = await service.updateMatch('match-1', { venue: 'Nuevo Gimnasio' });

      expect(updated.venue).toBe('Nuevo Gimnasio');
      expect(mailService.sendMatchStatusChangeAlert).not.toHaveBeenCalled();
    });

    it('debe notificar automáticamente por correo a los árbitros nominados si el partido es SUSPENDIDO (RF10)', async () => {
      const existing = {
        id: 'match-1',
        status: MatchStatus.SCHEDULED,
        matchDateTime: new Date('2026-10-14T19:30:00.000Z'),
        tournament: 'LNB Chile',
        homeTeam: 'Catolica',
        awayTeam: 'Leones',
        venue: 'Estadio Palestino',
        nominations: [
          {
            user: {
              id: 'referee-1',
              firstName: 'Juan',
              lastName: 'Pérez',
              email: 'juan.perez@sgaob.cl',
            },
          },
          {
            user: {
              id: 'official-1',
              firstName: 'María',
              lastName: 'González',
              email: 'maria.gonzalez@sgaob.cl',
            },
          },
        ],
      };

      prisma.match.findUnique.mockResolvedValue(existing);
      prisma.match.update.mockResolvedValue({ ...existing, status: MatchStatus.SUSPENDED });

      await service.updateMatch(
        'match-1',
        { status: MatchStatus.SUSPENDED },
        'admin-user-id',
      );

      // Debe haber enviado 2 correos (a Juan y a María)
      expect(mailService.sendMatchStatusChangeAlert).toHaveBeenCalledTimes(2);
      expect(mailService.sendMatchStatusChangeAlert).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'juan.perez@sgaob.cl',
          refereeName: 'Juan Pérez',
          newStatus: MatchStatus.SUSPENDED,
          previousStatus: MatchStatus.SCHEDULED,
        }),
      );
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.MATCH_STATUS_UPDATED,
        }),
      );
    });
  });

  describe('triggerSync (RF09)', () => {
    it('debe encolar la sincronización en el servicio de colas', async () => {
      const res = await service.triggerSync({ platform: MatchPlatform.SWISH, mock: true }, 'admin-id');

      expect(res.success).toBe(true);
      expect(queueService.addSyncJob).toHaveBeenCalledWith({
        platform: MatchPlatform.SWISH,
        mock: true,
        requestedBy: 'admin-id',
      });
    });
  });

  describe('processSync (Worker & Ingesta)', () => {
    it('debe ingerir partidos desde el proveedor e insertar en base de datos', async () => {
      prisma.match.findUnique.mockResolvedValue(null); // Partido nuevo
      prisma.match.create.mockResolvedValue({ id: 'match-created-id' });

      const res = await service.processSync({ platform: MatchPlatform.SWISH, mock: true });

      expect(res.success).toBe(true);
      expect(res.createdCount).toBe(1);
      expect(prisma.match.create).toHaveBeenCalled();
      expect(prisma.integrationConfig.upsert).toHaveBeenCalled();
    });
  });
});
