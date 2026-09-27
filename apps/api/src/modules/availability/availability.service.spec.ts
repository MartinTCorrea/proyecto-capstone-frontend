import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { AvailabilityService, getDeadlineForDate } from './availability.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../../common/audit/audit.service';
import { AvailabilityBlock, DayType, RoleName, TimeBlockCode, UserStatus } from '@prisma/client';
import { AuditAction } from '@sgaob/shared';

describe('AvailabilityService', () => {
  let service: AvailabilityService;
  let prisma: PrismaService;
  let auditService: AuditService;

  const mockTimeBlock = {
    id: 'block-uuid-1',
    dayType: DayType.FIN_DE_SEMANA,
    blockCode: TimeBlockCode.HORARIO_1,
    startTime: '09:00',
    endTime: '14:00',
    description: 'Mañana Fin de Semana',
    isActive: true,
    updatedAt: new Date(),
  };

  const mockAvailability = {
    id: 'avail-uuid-1',
    userId: 'user-uuid-1',
    date: new Date('2030-10-12T00:00:00.000Z'),
    block: AvailabilityBlock.FULL,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AvailabilityService,
        {
          provide: PrismaService,
          useValue: {
            timeBlockConfig: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
            },
            availability: {
              findMany: jest.fn(),
              upsert: jest.fn(),
            },
            $transaction: jest.fn(),
          },
        },
        {
          provide: AuditService,
          useValue: {
            log: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    service = module.get<AvailabilityService>(AvailabilityService);
    prisma = module.get<PrismaService>(PrismaService);
    auditService = module.get<AuditService>(AuditService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getDeadlineForDate helper', () => {
    it('should calculate Wednesday 23:59:59 of the target week correctly', () => {
      // 2026-10-03 is a Saturday. The Monday is 2026-09-28. The Wednesday is 2026-09-30.
      const deadline = getDeadlineForDate('2026-10-03');
      expect(deadline.getUTCFullYear()).toBe(2026);
      expect(deadline.getUTCMonth()).toBe(8); // September (0-indexed: 8)
      expect(deadline.getUTCDate()).toBe(30);
      expect(deadline.getUTCHours()).toBe(23);
      expect(deadline.getUTCMinutes()).toBe(59);
    });
  });

  describe('getTimeBlocks', () => {
    it('should return active time blocks ordered by dayType and blockCode', async () => {
      (prisma.timeBlockConfig.findMany as jest.Mock).mockResolvedValueOnce([mockTimeBlock]);

      const result = await service.getTimeBlocks();
      expect(result).toHaveLength(1);
      expect(result[0].blockCode).toBe(TimeBlockCode.HORARIO_1);
      expect(prisma.timeBlockConfig.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        orderBy: [{ dayType: 'asc' }, { blockCode: 'asc' }],
      });
    });
  });

  describe('updateTimeBlock', () => {
    it('should throw NotFoundException if time block does not exist', async () => {
      (prisma.timeBlockConfig.findUnique as jest.Mock).mockResolvedValueOnce(null);

      await expect(
        service.updateTimeBlock('non-existent', { startTime: '10:00' }, 'admin-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if startTime >= endTime', async () => {
      (prisma.timeBlockConfig.findUnique as jest.Mock).mockResolvedValueOnce(mockTimeBlock);

      await expect(
        service.updateTimeBlock('block-uuid-1', { startTime: '15:00', endTime: '14:00' }, 'admin-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should update time block and log audit action', async () => {
      (prisma.timeBlockConfig.findUnique as jest.Mock).mockResolvedValueOnce(mockTimeBlock);
      (prisma.timeBlockConfig.update as jest.Mock).mockResolvedValueOnce({
        ...mockTimeBlock,
        startTime: '08:30',
      });

      const result = await service.updateTimeBlock(
        'block-uuid-1',
        { startTime: '08:30' },
        'admin-uuid-1',
      );

      expect(result.startTime).toBe('08:30');
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'admin-uuid-1',
          entityType: 'TimeBlockConfig',
          entityId: 'block-uuid-1',
        }),
      );
    });
  });

  describe('getMyAvailability', () => {
    it('should return formatted availability entries for user', async () => {
      (prisma.availability.findMany as jest.Mock).mockResolvedValueOnce([mockAvailability]);

      const result = await service.getMyAvailability('user-uuid-1', {
        startDate: '2030-10-01',
        endDate: '2030-10-31',
      });

      expect(result).toHaveLength(1);
      expect(result[0].date).toBe('2030-10-12');
      expect(result[0].block).toBe(AvailabilityBlock.FULL);
      expect(prisma.availability.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: 'user-uuid-1',
            date: expect.any(Object),
          }),
        }),
      );
    });
  });

  describe('declareBulk', () => {
    it('should reject past dates / closed deadlines when not in bypass mode (RF05)', async () => {
      // 2020-01-01 is definitely in the past
      const dto = {
        availabilities: [{ date: '2020-01-01', block: AvailabilityBlock.FULL }],
      };

      await expect(service.declareBulk('user-uuid-1', dto, false)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should allow past dates if isBypassDeadline is true (Admin override)', async () => {
      const dto = {
        availabilities: [{ date: '2020-01-01', block: AvailabilityBlock.FULL }],
      };

      (prisma.$transaction as jest.Mock).mockImplementationOnce(async (callback) => {
        const tx = {
          availability: {
            upsert: jest.fn().mockResolvedValue({
              id: 'avail-uuid-2',
              userId: 'user-uuid-1',
              date: new Date('2020-01-01T00:00:00.000Z'),
              block: AvailabilityBlock.FULL,
            }),
          },
        };
        return callback(tx);
      });

      const result = await service.declareBulk('user-uuid-1', dto, true);

      expect(result).toHaveLength(1);
      expect(result[0].date).toBe('2020-01-01');
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-uuid-1',
          action: AuditAction.AVAILABILITY_SUBMITTED,
        }),
      );
    });

    it('should upsert availabilities for future valid dates within deadline', async () => {
      // Date far in the future
      const futureDate = '2040-10-15';
      const dto = {
        availabilities: [
          { date: futureDate, block: AvailabilityBlock.HORARIO_1 },
        ],
      };

      (prisma.$transaction as jest.Mock).mockImplementationOnce(async (callback) => {
        const tx = {
          availability: {
            upsert: jest.fn().mockResolvedValue({
              id: 'avail-uuid-3',
              userId: 'user-uuid-1',
              date: new Date(`${futureDate}T00:00:00.000Z`),
              block: AvailabilityBlock.HORARIO_1,
            }),
          },
        };
        return callback(tx);
      });

      const result = await service.declareBulk('user-uuid-1', dto, false);

      expect(result).toHaveLength(1);
      expect(result[0].block).toBe(AvailabilityBlock.HORARIO_1);
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-uuid-1',
          action: AuditAction.AVAILABILITY_SUBMITTED,
        }),
      );
    });
  });

  describe('getAvailabilitySummary', () => {
    it('should calculate counts and return personnel details for CT', async () => {
      const mockRecord = {
        id: 'avail-1',
        block: AvailabilityBlock.FULL,
        user: {
          id: 'user-1',
          firstName: 'Juan',
          lastName: 'Pérez',
          email: 'juan@sgaob.cl',
          phone: '+56912345678',
          status: UserStatus.ACTIVE,
          roles: [{ role: { name: RoleName.ARBITRO } }],
        },
      };

      (prisma.availability.findMany as jest.Mock).mockResolvedValueOnce([mockRecord]);

      const result = await service.getAvailabilitySummary({
        date: '2026-10-03',
        role: RoleName.ARBITRO,
      });

      expect(result.date).toBe('2026-10-03');
      expect(result.totalAvailable).toBe(1);
      expect(result.counts.FULL).toBe(1);
      expect(result.personnel).toHaveLength(1);
      expect(result.personnel[0].fullName).toBe('Juan Pérez');
      expect(result.personnel[0].roles).toContain(RoleName.ARBITRO);
    });
  });
});
