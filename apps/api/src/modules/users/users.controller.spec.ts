import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { RoleName, UserStatus } from '@prisma/client';
import { AuthenticatedUser } from '../auth/auth.types';
import { Request } from 'express';

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

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
    firstName: 'Juan',
    lastName: 'Pérez',
    phone: '+56911223344',
    status: UserStatus.ACTIVE,
    dataConsent: true,
    dataConsentDate: new Date(),
    roles: [RoleName.ARBITRO],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: {
            createUser: jest.fn().mockResolvedValue(mockArbitroUser),
            findAll: jest.fn().mockResolvedValue({
              data: [mockArbitroUser],
              meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
            }),
            findById: jest.fn().mockResolvedValue(mockArbitroUser),
            updateUser: jest.fn().mockResolvedValue(mockArbitroUser),
            assignRoles: jest.fn().mockResolvedValue(mockArbitroUser),
            updateStatus: jest.fn().mockResolvedValue(mockArbitroUser),
            recordConsent: jest.fn().mockResolvedValue({
              success: true,
              dataConsentDate: new Date(),
            }),
          },
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createUser', () => {
    it('should delegate to usersService with admin ID', async () => {
      const dto = {
        email: 'arbitro@sgaob.cl',
        firstName: 'Juan',
        lastName: 'Pérez',
      };

      const result = await controller.createUser(dto, mockAdminUser);
      expect(result).toEqual(mockArbitroUser);
      expect(service.createUser).toHaveBeenCalledWith(dto, 'admin-uuid-1');
    });
  });

  describe('findAll', () => {
    it('should delegate query parameters to usersService', async () => {
      const query = { page: 1, limit: 10, role: RoleName.ARBITRO };
      const result = await controller.findAll(query);
      expect(result.data).toHaveLength(1);
      expect(service.findAll).toHaveBeenCalledWith(query);
    });
  });

  describe('findById', () => {
    it('should allow user to view their own profile', async () => {
      const result = await controller.findById('arbitro-uuid-1', mockArbitroUser);
      expect(result).toEqual(mockArbitroUser);
      expect(service.findById).toHaveBeenCalledWith('arbitro-uuid-1');
    });

    it('should allow admin to view another user profile', async () => {
      const result = await controller.findById('arbitro-uuid-1', mockAdminUser);
      expect(result).toEqual(mockArbitroUser);
      expect(service.findById).toHaveBeenCalledWith('arbitro-uuid-1');
    });

    it('should throw ForbiddenException when non-admin views another user profile', async () => {
      await expect(
        controller.findById('other-user-id', mockArbitroUser),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('updateUser', () => {
    it('should allow user to update their own profile', async () => {
      const dto = { firstName: 'Juan Carlos' };
      const result = await controller.updateUser(
        'arbitro-uuid-1',
        dto,
        mockArbitroUser,
      );
      expect(result).toEqual(mockArbitroUser);
      expect(service.updateUser).toHaveBeenCalledWith(
        'arbitro-uuid-1',
        dto,
        'arbitro-uuid-1',
      );
    });

    it('should throw ForbiddenException when non-admin updates another user profile', async () => {
      await expect(
        controller.updateUser('other-user-id', { firstName: 'Hack' }, mockArbitroUser),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('assignRoles', () => {
    it('should delegate to usersService with admin ID', async () => {
      const dto = { roles: [RoleName.ARBITRO, RoleName.OFICIAL_MESA] };
      const result = await controller.assignRoles(
        'arbitro-uuid-1',
        dto,
        mockAdminUser,
      );
      expect(result).toEqual(mockArbitroUser);
      expect(service.assignRoles).toHaveBeenCalledWith(
        'arbitro-uuid-1',
        dto,
        'admin-uuid-1',
      );
    });
  });

  describe('updateStatus', () => {
    it('should delegate to usersService with admin ID', async () => {
      const dto = { status: UserStatus.INACTIVE };
      const result = await controller.updateStatus(
        'arbitro-uuid-1',
        dto,
        mockAdminUser,
      );
      expect(result).toEqual(mockArbitroUser);
      expect(service.updateStatus).toHaveBeenCalledWith(
        'arbitro-uuid-1',
        dto,
        'admin-uuid-1',
      );
    });
  });

  describe('recordConsent', () => {
    it('should extract client IP and record consent', async () => {
      const mockReq = {
        headers: { 'x-forwarded-for': '200.1.2.3' },
        socket: { remoteAddress: '127.0.0.1' },
      } as unknown as Request;

      const result = await controller.recordConsent(
        { consent: true },
        mockArbitroUser,
        mockReq,
      );
      expect(result.success).toBe(true);
      expect(service.recordConsent).toHaveBeenCalledWith(
        'arbitro-uuid-1',
        '200.1.2.3',
      );
    });
  });
});
