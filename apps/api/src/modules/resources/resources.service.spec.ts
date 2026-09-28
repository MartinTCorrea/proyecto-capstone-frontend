import { Test, TestingModule } from '@nestjs/testing';
import { ResourcesService } from './resources.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../../common/audit/audit.service';
import {
  ResourceType,
  ResourceVisibility,
  RoleName,
  NominationStatus,
  MatchRole,
  MatchTimeBlock,
} from '@sgaob/shared';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

describe('ResourcesService', () => {
  let service: ResourcesService;
  let prisma: any;
  let auditService: any;

  const mockAdminUser = {
    id: 'admin-1',
    firstName: 'Admin',
    lastName: 'Comisión',
    email: 'admin@sgaob.cl',
  };

  const mockDocumentResource = {
    id: 'res-doc-1',
    type: ResourceType.DOCUMENTO,
    title: 'Protocolo de Arbitraje 2026',
    description: 'Manual oficial de procedimientos',
    fileUrl: 'https://docs.sgaob.cl/protocolo.pdf',
    content: null,
    visibility: ResourceVisibility.AUTHENTICATED,
    createdById: 'admin-1',
    createdAt: new Date(),
    createdBy: mockAdminUser,
  };

  const mockCredentialResource = {
    id: 'res-cred-1',
    type: ResourceType.CREDENCIAL,
    title: 'Credencial API Swish Torneos',
    description: 'API Key del sistema Swish oficial',
    fileUrl: null,
    content: 'API_KEY=secret_key_12345',
    visibility: ResourceVisibility.ADMIN,
    createdById: 'admin-1',
    createdAt: new Date(),
    createdBy: mockAdminUser,
  };

  beforeEach(async () => {
    prisma = {
      resource: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      nomination: {
        findMany: jest.fn(),
      },
    };

    auditService = {
      log: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResourcesService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    service = module.get<ResourcesService>(ResourcesService);
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('createResource', () => {
    it('debe crear un documento con visibilidad AUTHENTICATED por defecto', async () => {
      const dto = {
        type: ResourceType.DOCUMENTO,
        title: 'Bases Campeonato Nacional',
        description: 'Bases oficiales',
      };

      prisma.resource.create.mockResolvedValue({
        id: 'new-doc',
        ...dto,
        visibility: ResourceVisibility.AUTHENTICATED,
        createdById: 'admin-1',
      });

      const result = await service.createResource(dto, 'admin-1');

      expect(prisma.resource.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: ResourceType.DOCUMENTO,
            visibility: ResourceVisibility.AUTHENTICATED,
          }),
        }),
      );
      expect(auditService.log).toHaveBeenCalled();
      expect(result.id).toBe('new-doc');
    });

    it('REGLA DURA Anexo A.5: cuando type = CREDENCIAL debe forzar visibility = ADMIN incondicionalmente', async () => {
      const dto = {
        type: ResourceType.CREDENCIAL,
        title: 'Acceso Secreto NBN23',
        content: 'SECRET_TOKEN_999',
        visibility: ResourceVisibility.PUBLIC, // Intento de cliente de ponerla pública
      };

      prisma.resource.create.mockResolvedValue({
        id: 'new-cred',
        ...dto,
        visibility: ResourceVisibility.ADMIN, // Debe forzarse a ADMIN
        createdById: 'admin-1',
      });

      await service.createResource(dto, 'admin-1');

      expect(prisma.resource.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: ResourceType.CREDENCIAL,
            visibility: ResourceVisibility.ADMIN,
          }),
        }),
      );
    });
  });

  describe('getResources', () => {
    it('para usuario Árbitro u Oficial: debe excluir tipo CREDENCIAL y visibilidad ADMIN', async () => {
      prisma.resource.count.mockResolvedValue(1);
      prisma.resource.findMany.mockResolvedValue([mockDocumentResource]);

      const result = await service.getResources(
        {},
        'arbitro-1',
        [RoleName.ARBITRO],
      );

      expect(prisma.resource.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            type: { not: ResourceType.CREDENCIAL },
            visibility: {
              in: [ResourceVisibility.PUBLIC, ResourceVisibility.AUTHENTICATED],
            },
          }),
        }),
      );
      expect(result.data).toHaveLength(1);
      expect(result.data[0].type).toBe(ResourceType.DOCUMENTO);
    });

    it('para usuario Comisión Técnica (ADMIN): debe permitir ver credenciales y recursos ADMIN', async () => {
      prisma.resource.count.mockResolvedValue(2);
      prisma.resource.findMany.mockResolvedValue([
        mockDocumentResource,
        mockCredentialResource,
      ]);

      const result = await service.getResources(
        {},
        'admin-1',
        [RoleName.ADMIN_COMISION_TECNICA],
      );

      expect(prisma.resource.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.not.objectContaining({
            type: { not: ResourceType.CREDENCIAL },
          }),
        }),
      );
      expect(result.data).toHaveLength(2);
    });
  });

  describe('getResourceById', () => {
    it('debe lanzar NotFoundException si el recurso no existe', async () => {
      prisma.resource.findUnique.mockResolvedValue(null);

      await expect(
        service.getResourceById('inexistente', 'user-1', [RoleName.ARBITRO]),
      ).rejects.toThrow(NotFoundException);
    });

    it('debe lanzar ForbiddenException si un árbitro intenta ver una credencial', async () => {
      prisma.resource.findUnique.mockResolvedValue(mockCredentialResource);

      await expect(
        service.getResourceById('res-cred-1', 'arbitro-1', [RoleName.ARBITRO]),
      ).rejects.toThrow(ForbiddenException);
    });

    it('debe permitir a Comisión Técnica ver una credencial', async () => {
      prisma.resource.findUnique.mockResolvedValue(mockCredentialResource);

      const result = await service.getResourceById(
        'res-cred-1',
        'admin-1',
        [RoleName.ADMIN_COMISION_TECNICA],
      );

      expect(result).toBeDefined();
      expect(result.id).toBe('res-cred-1');
    });
  });

  describe('updateResource', () => {
    it('debe actualizar los datos y auditar el cambio', async () => {
      prisma.resource.findUnique.mockResolvedValue(mockDocumentResource);
      prisma.resource.update.mockResolvedValue({
        ...mockDocumentResource,
        title: 'Protocolo Actualizado 2026 v2',
      });

      const result = await service.updateResource(
        'res-doc-1',
        { title: 'Protocolo Actualizado 2026 v2' },
        'admin-1',
      );

      expect(result.title).toBe('Protocolo Actualizado 2026 v2');
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'RESOURCE_UPDATED' }),
      );
    });
  });

  describe('deleteResource', () => {
    it('debe eliminar el recurso y registrar auditoría', async () => {
      prisma.resource.findUnique.mockResolvedValue(mockDocumentResource);
      prisma.resource.delete.mockResolvedValue(mockDocumentResource);

      const result = await service.deleteResource('res-doc-1', 'admin-1');

      expect(prisma.resource.delete).toHaveBeenCalledWith({
        where: { id: 'res-doc-1' },
      });
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'RESOURCE_DELETED' }),
      );
      expect(result.success).toBe(true);
    });
  });

  describe('exportNominationsCsv (RF20)', () => {
    it('debe generar contenido CSV con cabeceras y codificación UTF-8 BOM', async () => {
      const mockNominations = [
        {
          id: 'nom-1',
          matchRole: MatchRole.ARBITRO_PRINCIPAL,
          status: NominationStatus.CONFIRMED,
          rejectionReason: null,
          match: {
            tournament: 'LNB Chile 2026',
            category: 'Adulto Varones',
            venue: 'Gimnasio Palestino',
            homeTeam: 'Catolica',
            awayTeam: 'Leones',
            timeBlock: MatchTimeBlock.HORARIO_2,
            matchDateTime: new Date('2026-10-15T19:30:00.000Z'),
          },
          user: {
            firstName: 'Carlos',
            lastName: 'Arbitro',
            email: 'carlos@sgaob.cl',
            phone: '+56911112222',
          },
        },
      ];

      prisma.nomination.findMany.mockResolvedValue(mockNominations);

      const result = await service.exportNominationsCsv({
        tournament: 'LNB Chile',
      });

      expect(result.filename).toContain('grilla-asignaciones-sgaob');
      expect(result.contentType).toBe('text/csv; charset=utf-8');
      expect(result.count).toBe(1);
      // Validar BOM para Excel
      expect(result.csvContent.startsWith('\uFEFF')).toBe(true);
      // Validar datos incluidos
      expect(result.csvContent).toContain('Catolica');
      expect(result.csvContent).toContain('Leones');
      expect(result.csvContent).toContain('Carlos Arbitro');
      expect(result.csvContent).toContain('ARBITRO_PRINCIPAL');
      expect(result.csvContent).toContain('CONFIRMED');
    });
  });
});
