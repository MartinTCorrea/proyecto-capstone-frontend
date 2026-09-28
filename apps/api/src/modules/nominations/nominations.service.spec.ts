import { Test, TestingModule } from '@nestjs/testing';
import { NominationsService } from './nominations.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../../common/audit/audit.service';
import { MailService } from '../../common/mail/mail.service';
import {
  MatchRole,
  RoleName,
  UserStatus,
  NominationStatus,
  MatchTimeBlock,
  AvailabilityBlock,
  AuditAction,
} from '@sgaob/shared';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';

describe('NominationsService', () => {
  let service: NominationsService;
  let prisma: any;
  let auditService: any;
  let mailService: any;

  const mockMatch = {
    id: 'match-1',
    tournament: 'LNB Chile 2026',
    category: 'Adulto Varones',
    homeTeam: 'Catolica',
    awayTeam: 'Leones',
    venue: 'Estadio Palestino',
    matchDateTime: new Date('2026-10-20T19:30:00.000Z'),
    timeBlock: MatchTimeBlock.HORARIO_2,
  };

  const mockArbitroUser = {
    id: 'user-arbitro-1',
    firstName: 'Carlos',
    lastName: 'Árbitro',
    email: 'carlos.arbitro@sgaob.cl',
    status: UserStatus.ACTIVE,
    roles: [{ role: { name: RoleName.ARBITRO } }],
  };

  const mockMesaUser = {
    id: 'user-mesa-1',
    firstName: 'Daniela',
    lastName: 'Mesa',
    email: 'daniela.mesa@sgaob.cl',
    status: UserStatus.ACTIVE,
    roles: [{ role: { name: RoleName.OFICIAL_MESA } }],
  };

  beforeEach(async () => {
    prisma = {
      match: {
        findUnique: jest.fn().mockResolvedValue(mockMatch),
      },
      user: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
      },
      availability: {
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn(),
      },
      nomination: {
        findMany: jest.fn().mockResolvedValue([]),
        findFirst: jest.fn().mockResolvedValue(null),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn().mockResolvedValue(0),
      },
    };

    auditService = {
      log: jest.fn().mockResolvedValue(undefined),
    };

    mailService = {
      sendNominationAlert: jest.fn().mockResolvedValue({ success: true }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NominationsService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: auditService },
        { provide: MailService, useValue: mailService },
      ],
    }).compile();

    service = module.get<NominationsService>(NominationsService);
  });

  describe('getAvailableCandidates (Cruce Inteligente de Disponibilidad y Roles)', () => {
    it('debe filtrar candidatos por el rol técnico requerido (ARBITRO para slots arbitrales)', async () => {
      prisma.user.findMany.mockResolvedValue([mockArbitroUser]);
      prisma.availability.findMany.mockResolvedValue([
        { userId: mockArbitroUser.id, block: AvailabilityBlock.HORARIO_2 },
      ]);

      const res = await service.getAvailableCandidates({
        matchId: 'match-1',
        matchRole: MatchRole.ARBITRO_PRINCIPAL,
      });

      expect(res.requiredSystemRole).toBe(RoleName.ARBITRO);
      expect(res.availableCandidates.length).toBe(1);
      expect(res.availableCandidates[0].id).toBe(mockArbitroUser.id);
      expect(res.availableCandidates[0].isAvailable).toBe(true);
    });

    it('debe clasificar como no disponible a un usuario cuyo bloque no coincide con el partido (RF12)', async () => {
      prisma.user.findMany.mockResolvedValue([mockArbitroUser]);
      // Partido es HORARIO_2, pero usuario declaró HORARIO_1
      prisma.availability.findMany.mockResolvedValue([
        { userId: mockArbitroUser.id, block: AvailabilityBlock.HORARIO_1 },
      ]);

      const res = await service.getAvailableCandidates({
        matchId: 'match-1',
        matchRole: MatchRole.ARBITRO_PRINCIPAL,
      });

      expect(res.availableCandidates.length).toBe(0);
      expect(res.unavailableCandidates.length).toBe(1);
      expect(res.unavailableCandidates[0].unavailableReason).toContain('Sin disponibilidad declarada');
    });

    it('debe detectar conflicto si el candidato ya está asignado a otro partido en el mismo bloque', async () => {
      prisma.user.findMany.mockResolvedValue([mockArbitroUser]);
      prisma.availability.findMany.mockResolvedValue([
        { userId: mockArbitroUser.id, block: AvailabilityBlock.FULL },
      ]);
      // Otro partido en el mismo bloque horario
      prisma.nomination.findMany.mockImplementation(({ where }: any) => {
        if (where?.matchId === 'match-1') return Promise.resolve([]);
        return Promise.resolve([
          {
            userId: mockArbitroUser.id,
            matchId: 'other-match',
            match: {
              id: 'other-match',
              tournament: 'Copa Soprole',
              homeTeam: 'Team A',
              awayTeam: 'Team B',
              timeBlock: MatchTimeBlock.HORARIO_2,
              matchDateTime: new Date('2026-10-20T20:00:00.000Z'),
            },
          },
        ]);
      });

      const res = await service.getAvailableCandidates({
        matchId: 'match-1',
        matchRole: MatchRole.ARBITRO_1,
      });

      expect(res.availableCandidates.length).toBe(0);
      expect(res.unavailableCandidates.length).toBe(1);
      expect(res.unavailableCandidates[0].hasConflict).toBe(true);
      expect(res.unavailableCandidates[0].unavailableReason).toContain('Conflicto de horario');
    });
  });

  describe('createNomination (Validaciones Duras y Despacho)', () => {
    it('debe crear la nominación y despachar alerta por correo si el rol y disponibilidad son válidos', async () => {
      prisma.user.findUnique.mockResolvedValue(mockArbitroUser);
      prisma.availability.findUnique.mockResolvedValue({
        userId: mockArbitroUser.id,
        block: AvailabilityBlock.HORARIO_2,
      });

      const createdNom = {
        id: 'nom-1',
        matchId: 'match-1',
        userId: mockArbitroUser.id,
        matchRole: MatchRole.ARBITRO_PRINCIPAL,
        status: NominationStatus.PENDING,
      };
      prisma.nomination.create.mockResolvedValue(createdNom);

      const res = await service.createNomination(
        {
          matchId: 'match-1',
          userId: mockArbitroUser.id,
          matchRole: MatchRole.ARBITRO_PRINCIPAL,
        },
        'admin-1',
      );

      expect(res).toEqual(createdNom);
      expect(mailService.sendNominationAlert).toHaveBeenCalledWith(
        expect.objectContaining({
          to: mockArbitroUser.email,
          refereeName: 'Carlos Árbitro',
          matchRole: MatchRole.ARBITRO_PRINCIPAL,
        }),
      );
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.NOMINATION_CREATED,
        }),
      );
    });

    it('debe rechazar la asignación si el usuario no tiene el rol correspondiente (Anexo A.1)', async () => {
      // Intentar nominar a un Oficial de Mesa como Árbitro Principal
      prisma.user.findUnique.mockResolvedValue(mockMesaUser);

      await expect(
        service.createNomination(
          {
            matchId: 'match-1',
            userId: mockMesaUser.id,
            matchRole: MatchRole.ARBITRO_PRINCIPAL,
          },
          'admin-1',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('debe rechazar con 400 si el usuario no tiene disponibilidad para el bloque (RF12)', async () => {
      prisma.user.findUnique.mockResolvedValue(mockArbitroUser);
      // Usuario declaró Horario 1, pero el partido es Horario 2
      prisma.availability.findUnique.mockResolvedValue({
        userId: mockArbitroUser.id,
        block: AvailabilityBlock.HORARIO_1,
      });

      await expect(
        service.createNomination(
          {
            matchId: 'match-1',
            userId: mockArbitroUser.id,
            matchRole: MatchRole.ARBITRO_PRINCIPAL,
          },
          'admin-1',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('debe permitir la asignación si se activa overrideAvailability con motivo justificado', async () => {
      prisma.user.findUnique.mockResolvedValue(mockArbitroUser);
      prisma.availability.findUnique.mockResolvedValue({
        userId: mockArbitroUser.id,
        block: AvailabilityBlock.HORARIO_1,
      });

      const createdNom = {
        id: 'nom-override',
        matchId: 'match-1',
        userId: mockArbitroUser.id,
        matchRole: MatchRole.ARBITRO_PRINCIPAL,
        status: NominationStatus.PENDING,
      };
      prisma.nomination.create.mockResolvedValue(createdNom);

      const res = await service.createNomination(
        {
          matchId: 'match-1',
          userId: mockArbitroUser.id,
          matchRole: MatchRole.ARBITRO_PRINCIPAL,
          overrideAvailability: true,
          overrideReason: 'Reemplazo de urgencia acordado telefónicamente',
        },
        'admin-1',
      );

      expect(res).toEqual(createdNom);
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.NOMINATION_OVERRIDDEN,
        }),
      );
    });

    it('debe rechazar con 409 si el slot ya está ocupado en el partido', async () => {
      prisma.nomination.findFirst.mockResolvedValueOnce({
        id: 'existing-nom',
        matchRole: MatchRole.ARBITRO_PRINCIPAL,
        status: NominationStatus.CONFIRMED,
      });

      await expect(
        service.createNomination(
          {
            matchId: 'match-1',
            userId: mockArbitroUser.id,
            matchRole: MatchRole.ARBITRO_PRINCIPAL,
          },
          'admin-1',
        ),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('respondNomination (Confirmar o Rechazar con Motivo RF15)', () => {
    it('debe permitir al usuario nominado confirmar su designación', async () => {
      const existing = {
        id: 'nom-1',
        userId: 'user-arbitro-1',
        status: NominationStatus.PENDING,
        match: mockMatch,
      };
      prisma.nomination.findUnique.mockResolvedValue(existing);
      prisma.nomination.update.mockResolvedValue({
        ...existing,
        status: NominationStatus.CONFIRMED,
      });

      const res = await service.respondNomination(
        'nom-1',
        { status: NominationStatus.CONFIRMED },
        'user-arbitro-1',
        false,
      );

      expect(res.status).toBe(NominationStatus.CONFIRMED);
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.NOMINATION_STATUS_CHANGED,
        }),
      );
    });

    it('debe exigir motivo de rechazo si el usuario rechaza la nominación (RF15)', async () => {
      const existing = {
        id: 'nom-1',
        userId: 'user-arbitro-1',
        status: NominationStatus.PENDING,
        match: mockMatch,
      };
      prisma.nomination.findUnique.mockResolvedValue(existing);

      await expect(
        service.respondNomination(
          'nom-1',
          { status: NominationStatus.REJECTED, rejectionReason: '' },
          'user-arbitro-1',
          false,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('debe rechazar con 403 si un usuario intenta responder la nominación de otro', async () => {
      const existing = {
        id: 'nom-1',
        userId: 'other-user',
        status: NominationStatus.PENDING,
        match: mockMatch,
      };
      prisma.nomination.findUnique.mockResolvedValue(existing);

      await expect(
        service.respondNomination(
          'nom-1',
          { status: NominationStatus.CONFIRMED },
          'user-arbitro-1',
          false,
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
