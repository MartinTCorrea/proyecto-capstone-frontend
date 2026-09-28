import { Test, TestingModule } from '@nestjs/testing';
import { NominationsController } from './nominations.controller';
import { NominationsService } from './nominations.service';
import { MatchRole, NominationStatus, RoleName } from '@sgaob/shared';

describe('NominationsController', () => {
  let controller: NominationsController;
  let service: any;

  beforeEach(async () => {
    service = {
      getNominations: jest.fn().mockResolvedValue({
        data: [],
        meta: { total: 0, page: 1, limit: 20, totalPages: 0 },
      }),
      getAvailableCandidates: jest.fn().mockResolvedValue({
        availableCandidates: [],
        unavailableCandidates: [],
      }),
      getNominationById: jest.fn().mockResolvedValue({ id: 'nom-1' }),
      createNomination: jest.fn().mockResolvedValue({ id: 'nom-1' }),
      respondNomination: jest.fn().mockResolvedValue({ id: 'nom-1', status: NominationStatus.CONFIRMED }),
      deleteNomination: jest.fn().mockResolvedValue({ success: true }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [NominationsController],
      providers: [{ provide: NominationsService, useValue: service }],
    }).compile();

    controller = module.get<NominationsController>(NominationsController);
  });

  it('debe estar definido', () => {
    expect(controller).toBeDefined();
  });

  it('getNominations debe delegar en NominationsService.getNominations', async () => {
    const query = { page: 1, limit: 10 };
    await controller.getNominations(query, 'user-1', [RoleName.ARBITRO]);
    expect(service.getNominations).toHaveBeenCalledWith(query, 'user-1', [RoleName.ARBITRO]);
  });

  it('getAvailableCandidates debe delegar en NominationsService.getAvailableCandidates', async () => {
    const query = { matchId: 'match-1', matchRole: MatchRole.ARBITRO_PRINCIPAL };
    await controller.getAvailableCandidates(query);
    expect(service.getAvailableCandidates).toHaveBeenCalledWith(query);
  });

  it('createNomination debe delegar en NominationsService.createNomination', async () => {
    const dto = {
      matchId: 'match-1',
      userId: 'user-1',
      matchRole: MatchRole.ARBITRO_PRINCIPAL,
    };
    await controller.createNomination(dto, 'admin-1');
    expect(service.createNomination).toHaveBeenCalledWith(dto, 'admin-1');
  });

  it('respondNomination debe delegar en NominationsService.respondNomination', async () => {
    const dto = { status: NominationStatus.CONFIRMED };
    await controller.respondNomination('nom-1', dto, 'user-1', [RoleName.ARBITRO]);
    expect(service.respondNomination).toHaveBeenCalledWith('nom-1', dto, 'user-1', false);
  });

  it('deleteNomination debe delegar en NominationsService.deleteNomination', async () => {
    await controller.deleteNomination('nom-1', 'admin-1');
    expect(service.deleteNomination).toHaveBeenCalledWith('nom-1', 'admin-1');
  });
});
