import { Test, TestingModule } from '@nestjs/testing';
import { ResourcesController } from './resources.controller';
import { ResourcesService } from './resources.service';
import { ResourceType, ResourceVisibility, RoleName } from '@sgaob/shared';

describe('ResourcesController', () => {
  let controller: ResourcesController;
  let service: any;

  beforeEach(async () => {
    service = {
      getResources: jest.fn().mockResolvedValue({
        data: [],
        meta: { total: 0, page: 1, limit: 20, totalPages: 1 },
      }),
      getResourceById: jest.fn().mockResolvedValue({ id: 'res-1' }),
      createResource: jest.fn().mockResolvedValue({ id: 'res-1' }),
      updateResource: jest.fn().mockResolvedValue({ id: 'res-1' }),
      deleteResource: jest.fn().mockResolvedValue({ success: true }),
      exportNominationsCsv: jest.fn().mockResolvedValue({
        filename: 'asignaciones.csv',
        contentType: 'text/csv; charset=utf-8',
        csvContent: '\uFEFFheader1;header2',
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ResourcesController],
      providers: [{ provide: ResourcesService, useValue: service }],
    }).compile();

    controller = module.get<ResourcesController>(ResourcesController);
  });

  it('debe estar definido', () => {
    expect(controller).toBeDefined();
  });

  it('getResources debe delegar en service.getResources', async () => {
    const query = { page: 1, limit: 10 };
    await controller.getResources(query, 'user-1', [RoleName.ARBITRO]);
    expect(service.getResources).toHaveBeenCalledWith(query, 'user-1', [RoleName.ARBITRO]);
  });

  it('getResourceById debe delegar en service.getResourceById', async () => {
    await controller.getResourceById('res-1', 'user-1', [RoleName.ARBITRO]);
    expect(service.getResourceById).toHaveBeenCalledWith('res-1', 'user-1', [RoleName.ARBITRO]);
  });

  it('createResource debe delegar en service.createResource', async () => {
    const dto = {
      type: ResourceType.DOCUMENTO,
      title: 'Bases 2026',
      visibility: ResourceVisibility.AUTHENTICATED,
    };
    await controller.createResource(dto, 'admin-1');
    expect(service.createResource).toHaveBeenCalledWith(dto, 'admin-1');
  });

  it('updateResource debe delegar en service.updateResource', async () => {
    const dto = { title: 'Nuevo Título' };
    await controller.updateResource('res-1', dto, 'admin-1');
    expect(service.updateResource).toHaveBeenCalledWith('res-1', dto, 'admin-1');
  });

  it('deleteResource debe delegar en service.deleteResource', async () => {
    await controller.deleteResource('res-1', 'admin-1');
    expect(service.deleteResource).toHaveBeenCalledWith('res-1', 'admin-1');
  });

  it('exportNominations debe configurar headers y enviar contenido', async () => {
    const res: any = {
      setHeader: jest.fn(),
      send: jest.fn().mockReturnValue('ok'),
    };
    await controller.exportNominations({}, res);
    expect(service.exportNominationsCsv).toHaveBeenCalled();
    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/csv; charset=utf-8');
    expect(res.setHeader).toHaveBeenCalledWith(
      'Content-Disposition',
      'attachment; filename="asignaciones.csv"',
    );
    expect(res.send).toHaveBeenCalledWith('\uFEFFheader1;header2');
  });
});
