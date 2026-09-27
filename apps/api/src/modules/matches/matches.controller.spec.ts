import { Test, TestingModule } from '@nestjs/testing';
import { MatchesController } from './matches.controller';
import { MatchesService } from './matches.service';
import { MatchPlatform, MatchStatus, MatchTimeBlock } from '@sgaob/shared';

describe('MatchesController', () => {
  let controller: MatchesController;
  let service: any;

  beforeEach(async () => {
    service = {
      getMatches: jest.fn().mockResolvedValue({
        data: [],
        meta: { total: 0, page: 1, limit: 20, totalPages: 0 },
      }),
      getMatchById: jest.fn().mockResolvedValue({
        id: 'match-1',
        tournament: 'LNB',
      }),
      createMatch: jest.fn().mockResolvedValue({
        id: 'match-1',
        platform: MatchPlatform.MANUAL,
      }),
      updateMatch: jest.fn().mockResolvedValue({
        id: 'match-1',
        status: MatchStatus.RESCHEDULED,
      }),
      deleteMatch: jest.fn().mockResolvedValue({
        success: true,
        message: 'Partido eliminado',
      }),
      triggerSync: jest.fn().mockResolvedValue({
        success: true,
        jobId: 'job-123',
      }),
      testIntegration: jest.fn().mockResolvedValue({
        success: true,
        message: 'Conectado a Sandbox',
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MatchesController],
      providers: [{ provide: MatchesService, useValue: service }],
    }).compile();

    controller = module.get<MatchesController>(MatchesController);
  });

  it('debe estar definido', () => {
    expect(controller).toBeDefined();
  });

  it('getMatches debe delegar en MatchesService.getMatches', async () => {
    const query = { page: 1, limit: 10, tournament: 'LNB' };
    const res = await controller.getMatches(query);

    expect(service.getMatches).toHaveBeenCalledWith(query);
    expect(res.meta.total).toBe(0);
  });

  it('getMatchById debe delegar en MatchesService.getMatchById', async () => {
    const res = await controller.getMatchById('match-1');

    expect(service.getMatchById).toHaveBeenCalledWith('match-1');
    expect(res.id).toBe('match-1');
  });

  it('createMatch debe delegar en MatchesService.createMatch con el adminId', async () => {
    const dto = {
      tournament: 'LNB',
      category: 'Adultos',
      homeTeam: 'Catolica',
      awayTeam: 'Leones',
      venue: 'Palestino',
      matchDateTime: '2026-10-15T20:00:00.000Z',
    };

    const res = await controller.createMatch(dto, 'admin-123');

    expect(service.createMatch).toHaveBeenCalledWith(dto, 'admin-123');
    expect(res.platform).toBe(MatchPlatform.MANUAL);
  });

  it('updateMatch debe delegar en MatchesService.updateMatch', async () => {
    const dto = { status: MatchStatus.RESCHEDULED };
    const res = await controller.updateMatch('match-1', dto, 'admin-123');

    expect(service.updateMatch).toHaveBeenCalledWith('match-1', dto, 'admin-123');
    expect(res.status).toBe(MatchStatus.RESCHEDULED);
  });

  it('triggerSync debe delegar en MatchesService.triggerSync', async () => {
    const dto = { platform: MatchPlatform.SWISH, mock: true };
    const res = await controller.triggerSync(dto, 'admin-123');

    expect(service.triggerSync).toHaveBeenCalledWith(dto, 'admin-123');
    expect(res.success).toBe(true);
  });

  it('testIntegration debe delegar en MatchesService.testIntegration', async () => {
    const res = await controller.testIntegration(MatchPlatform.SWISH);

    expect(service.testIntegration).toHaveBeenCalledWith(MatchPlatform.SWISH);
    expect(res.success).toBe(true);
  });
});
