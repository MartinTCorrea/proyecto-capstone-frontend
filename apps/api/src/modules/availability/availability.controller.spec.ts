import { Test, TestingModule } from '@nestjs/testing';
import { AvailabilityController } from './availability.controller';
import { AvailabilityService } from './availability.service';
import { RoleName, UserStatus, AvailabilityBlock } from '@prisma/client';
import { AuthenticatedUser } from '../auth/auth.types';

describe('AvailabilityController', () => {
  let controller: AvailabilityController;
  let service: AvailabilityService;

  const mockAdminUser: AuthenticatedUser = {
    id: 'admin-uuid-1',
    externalId: 'ext-admin-1',
    email: 'admin@sgaob.cl',
    firstName: 'Admin',
    lastName: 'Principal',
    phone: null,
    status: UserStatus.ACTIVE,
    dataConsent: true,
    dataConsentDate: new Date(),
    roles: [RoleName.ADMIN_COMISION_TECNICA],
  };

  const mockArbitroUser: AuthenticatedUser = {
    id: 'arbitro-uuid-1',
    externalId: 'ext-arbitro-1',
    email: 'arbitro@sgaob.cl',
    firstName: 'Carlos',
    lastName: 'Pérez',
    phone: '+56912345678',
    status: UserStatus.ACTIVE,
    dataConsent: true,
    dataConsentDate: new Date(),
    roles: [RoleName.ARBITRO],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AvailabilityController],
      providers: [
        {
          provide: AvailabilityService,
          useValue: {
            getTimeBlocks: jest.fn().mockResolvedValue([]),
            updateTimeBlock: jest.fn().mockResolvedValue({ id: 'block-1' }),
            getMyAvailability: jest.fn().mockResolvedValue([]),
            declareBulk: jest.fn().mockResolvedValue([]),
            getAvailabilitySummary: jest.fn().mockResolvedValue({ counts: {}, personnel: [] }),
          },
        },
      ],
    }).compile();

    controller = module.get<AvailabilityController>(AvailabilityController);
    service = module.get<AvailabilityService>(AvailabilityService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getTimeBlocks', () => {
    it('should delegate to availabilityService.getTimeBlocks', async () => {
      await controller.getTimeBlocks();
      expect(service.getTimeBlocks).toHaveBeenCalled();
    });
  });

  describe('updateTimeBlock', () => {
    it('should delegate update to availabilityService with admin id', async () => {
      const dto = { startTime: '09:00', endTime: '13:00' };
      await controller.updateTimeBlock('block-1', dto, mockAdminUser);
      expect(service.updateTimeBlock).toHaveBeenCalledWith('block-1', dto, 'admin-uuid-1');
    });
  });

  describe('getMyAvailability', () => {
    it('should query availability for authenticated user', async () => {
      const query = { startDate: '2026-10-01' };
      await controller.getMyAvailability(mockArbitroUser, query);
      expect(service.getMyAvailability).toHaveBeenCalledWith('arbitro-uuid-1', query);
    });
  });

  describe('declareBulk', () => {
    it('should declare availability with isBypass = false for regular referee', async () => {
      const dto = {
        availabilities: [{ date: '2026-10-03', block: AvailabilityBlock.FULL }],
      };
      await controller.declareBulk(mockArbitroUser, dto);
      expect(service.declareBulk).toHaveBeenCalledWith('arbitro-uuid-1', dto, false);
    });

    it('should declare availability with isBypass = true for admin user', async () => {
      const dto = {
        availabilities: [{ date: '2026-10-03', block: AvailabilityBlock.FULL }],
      };
      await controller.declareBulk(mockAdminUser, dto);
      expect(service.declareBulk).toHaveBeenCalledWith('admin-uuid-1', dto, true);
    });
  });

  describe('getAvailabilitySummary', () => {
    it('should delegate summary query to service', async () => {
      const query = { date: '2026-10-03', role: RoleName.ARBITRO };
      await controller.getAvailabilitySummary(query);
      expect(service.getAvailabilitySummary).toHaveBeenCalledWith(query);
    });
  });
});
