import { MockSyncProvider } from './mock-sync.provider';
import { MatchPlatform, MatchStatus } from '@sgaob/shared';

describe('MockSyncProvider', () => {
  let provider: MockSyncProvider;

  beforeEach(() => {
    provider = new MockSyncProvider();
  });

  it('debe tener definida la plataforma SWISH', () => {
    expect(provider.platform).toBe(MatchPlatform.SWISH);
  });

  it('debe responder exitosamente la prueba de conexión sandbox', async () => {
    const res = await provider.testConnection();
    expect(res.success).toBe(true);
    expect(res.message).toContain('Sandbox/Mock');
  });

  it('debe generar una lista de partidos realistas de básquetbol chileno', async () => {
    const matches = await provider.fetchMatches();

    expect(matches.length).toBeGreaterThanOrEqual(10);

    const first = matches[0];
    expect(first.platform).toBe(MatchPlatform.SWISH);
    expect(first.externalId).toMatch(/^SWISH-CHL-\d+$/);
    expect(first.tournament).toBeTruthy();
    expect(first.category).toBeTruthy();
    expect(first.homeTeam).toBeTruthy();
    expect(first.awayTeam).toBeTruthy();
    expect(first.venue).toBeTruthy();
    expect(first.matchDateTime).toBeInstanceOf(Date);
    expect(first.status).toBeDefined();

    // Validar que incluya casos de prueba para RF10 (partidos reprogramados o suspendidos)
    const hasRescheduled = matches.some((m) => m.status === MatchStatus.RESCHEDULED);
    const hasSuspended = matches.some((m) => m.status === MatchStatus.SUSPENDED);

    expect(hasRescheduled).toBe(true);
    expect(hasSuspended).toBe(true);
  });
});
