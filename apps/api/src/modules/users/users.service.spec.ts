import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { UsersService } from './users.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../../common/audit/audit.service';
import { RoleName, UserStatus } from '@prisma/client';
import { AuditAction } from '@sgaob/shared';
import { CreateUserDto, UpdateUserDto, AssignRolesDto, UpdateUserStatusDto } from './dto';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: PrismaService;
  let auditService: AuditService;

  const mockUserRecord = {
    id: 'user-uuid-1',
    externalId: 'ext-user-1',
    email: 'carlos.arbitro@sgaob.cl',
    firstName: 'Carlos',
    lastName: 'Pérez',
    phone: '+56911223344',
    status: UserStatus.ACTIVE,
    dataConsent: true,
    dataConsentDate: new Date('2026-03-01T12:00:00Z'),
    roles: [
      {
        role: {
          id: 'role-uuid-1',
          name: RoleName.ARBITRO,
        },
      },
    ],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              findMany: jest.fn(),
              count: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
            role: {
              findUnique: jest.fn(),
            },
            userRole: {
              create: jest.fn(),
              deleteMany: jest.fn(),
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

    service = module.get<UsersService>(UsersService);
    prisma = module.get<PrismaService>(PrismaService);
    auditService = module.get<AuditService>(AuditService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createUser', () => {
    const createDto: CreateUserDto = {
      email: 'nuevo@sgaob.cl',
      firstName: 'Ana',
      lastName: 'Gómez',
      phone: '+56987654321',
      roles: [RoleName.OFICIAL_MESA],
    };

    it('should throw ConflictException if email is already taken', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(mockUserRecord);

      await expect(service.createUser(createDto, 'admin-1')).rejects.toThrow(
        ConflictException,
      );
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: createDto.email },
      });
    });

    it('should create user with roles and log audit action', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(null);

      const createdUserRecord = {
        ...mockUserRecord,
        id: 'user-uuid-2',
        email: createDto.email,
        firstName: createDto.firstName,
        lastName: createDto.lastName,
        roles: [{ role: { id: 'role-oficial-1', name: RoleName.OFICIAL_MESA } }],
      };

      (prisma.$transaction as jest.Mock).mockImplementationOnce(async (callback) => {
        const tx = {
          user: {
            create: jest.fn().mockResolvedValue({ id: 'user-uuid-2' }),
            findUnique: jest.fn().mockResolvedValue(createdUserRecord),
          },
          role: {
            findUnique: jest.fn().mockResolvedValue({ id: 'role-oficial-1', name: RoleName.OFICIAL_MESA }),
          },
          userRole: {
            create: jest.fn().mockResolvedValue({}),
          },
        };
        return callback(tx);
      });

      const result = await service.createUser(createDto, 'admin-uuid-1');

      expect(result.id).toBe('user-uuid-2');
      expect(result.email).toBe('nuevo@sgaob.cl');
      expect(result.roles).toContain(RoleName.OFICIAL_MESA);
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'admin-uuid-1',
          action: AuditAction.USER_CREATED,
          entityType: 'User',
          entityId: 'user-uuid-2',
        }),
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated list and calculate metadata correctly', async () => {
      (prisma.user.count as jest.Mock).mockResolvedValueOnce(25);
      (prisma.user.findMany as jest.Mock).mockResolvedValueOnce([mockUserRecord]);

      const result = await service.findAll({ page: 2, limit: 10, search: 'Carlos' });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe('user-uuid-1');
      expect(result.meta).toEqual({
        total: 25,
        page: 2,
        limit: 10,
        totalPages: 3,
      });

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              { firstName: { contains: 'Carlos', mode: 'insensitive' } },
            ]),
          }),
        }),
      );
    });

    it('should filter by role and status when provided', async () => {
      (prisma.user.count as jest.Mock).mockResolvedValueOnce(1);
      (prisma.user.findMany as jest.Mock).mockResolvedValueOnce([mockUserRecord]);

      await service.findAll({ role: RoleName.ARBITRO, status: UserStatus.ACTIVE });

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: UserStatus.ACTIVE,
            roles: {
              some: {
                role: {
                  name: RoleName.ARBITRO,
                },
              },
            },
          }),
        }),
      );
    });
  });

  describe('findById', () => {
    it('should return authenticated user when found', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(mockUserRecord);

      const result = await service.findById('user-uuid-1');
      expect(result.id).toBe('user-uuid-1');
      expect(result.email).toBe('carlos.arbitro@sgaob.cl');
    });

    it('should throw NotFoundException when user does not exist', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(null);

      await expect(service.findById('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateUser', () => {
    it('should update personal data and log audit action', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(mockUserRecord);

      const updateDto: UpdateUserDto = {
        firstName: 'Carlos Actualizado',
        phone: '+56999999999',
      };

      const updatedRecord = {
        ...mockUserRecord,
        firstName: 'Carlos Actualizado',
        phone: '+56999999999',
      };

      (prisma.user.update as jest.Mock).mockResolvedValueOnce(updatedRecord);

      const result = await service.updateUser('user-uuid-1', updateDto, 'admin-1');

      expect(result.firstName).toBe('Carlos Actualizado');
      expect(result.phone).toBe('+56999999999');
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'admin-1',
          action: AuditAction.USER_UPDATED,
          entityType: 'User',
          entityId: 'user-uuid-1',
        }),
      );
    });
  });

  describe('assignRoles', () => {
    it('should reassign roles, activate user if PENDING_ROLE, and log audit', async () => {
      const pendingUserRecord = {
        ...mockUserRecord,
        status: UserStatus.PENDING_ROLE,
        roles: [],
      };

      // 1st findById
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(pendingUserRecord);

      const assignDto: AssignRolesDto = {
        roles: [RoleName.ARBITRO, RoleName.OFICIAL_MESA],
      };

      const updatedRecord = {
        ...pendingUserRecord,
        status: UserStatus.ACTIVE,
        roles: [
          { role: { id: 'r1', name: RoleName.ARBITRO } },
          { role: { id: 'r2', name: RoleName.OFICIAL_MESA } },
        ],
      };

      (prisma.$transaction as jest.Mock).mockImplementationOnce(async (callback) => {
        const tx = {
          userRole: {
            deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
            create: jest.fn().mockResolvedValue({}),
          },
          role: {
            findUnique: jest
              .fn()
              .mockResolvedValueOnce({ id: 'r1', name: RoleName.ARBITRO })
              .mockResolvedValueOnce({ id: 'r2', name: RoleName.OFICIAL_MESA }),
          },
          user: {
            update: jest.fn().mockResolvedValue(updatedRecord),
          },
        };
        return callback(tx);
      });

      const result = await service.assignRoles('user-uuid-1', assignDto, 'admin-uuid-1');

      expect(result.status).toBe(UserStatus.ACTIVE);
      expect(result.roles).toHaveLength(2);
      expect(result.roles).toContain(RoleName.ARBITRO);
      expect(result.roles).toContain(RoleName.OFICIAL_MESA);
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'admin-uuid-1',
          action: AuditAction.ROLES_ASSIGNED,
          entityType: 'User',
          entityId: 'user-uuid-1',
        }),
      );
    });

    it('should throw NotFoundException if any requested role does not exist in db', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(mockUserRecord);

      const assignDto: AssignRolesDto = {
        roles: [RoleName.ARBITRO],
      };

      (prisma.$transaction as jest.Mock).mockImplementationOnce(async (callback) => {
        const tx = {
          userRole: {
            deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
          },
          role: {
            findUnique: jest.fn().mockResolvedValue(null),
          },
        };
        return callback(tx);
      });

      await expect(
        service.assignRoles('user-uuid-1', assignDto, 'admin-uuid-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateStatus', () => {
    it('should update user status and log audit action', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(mockUserRecord);

      const statusDto: UpdateUserStatusDto = {
        status: UserStatus.INACTIVE,
      };

      const updatedRecord = {
        ...mockUserRecord,
        status: UserStatus.INACTIVE,
      };

      (prisma.user.update as jest.Mock).mockResolvedValueOnce(updatedRecord);

      const result = await service.updateStatus('user-uuid-1', statusDto, 'admin-uuid-1');

      expect(result.status).toBe(UserStatus.INACTIVE);
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'admin-uuid-1',
          action: AuditAction.USER_UPDATED,
          entityType: 'User',
          entityId: 'user-uuid-1',
          details: {
            statusChange: {
              from: UserStatus.ACTIVE,
              to: UserStatus.INACTIVE,
            },
          },
        }),
      );
    });
  });

  describe('recordConsent', () => {
    it('should update dataConsent flag, set timestamp, and log audit', async () => {
      (prisma.user.update as jest.Mock).mockResolvedValueOnce({
        ...mockUserRecord,
        dataConsent: true,
        dataConsentDate: new Date(),
      });

      const result = await service.recordConsent('user-uuid-1', '192.168.1.50');

      expect(result.success).toBe(true);
      expect(result.dataConsentDate).toBeInstanceOf(Date);
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-uuid-1' },
          data: expect.objectContaining({
            dataConsent: true,
          }),
        }),
      );
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-uuid-1',
          action: AuditAction.USER_UPDATED,
          entityType: 'User',
          entityId: 'user-uuid-1',
          ipAddress: '192.168.1.50',
        }),
      );
    });
  });
});
