import { Injectable, Logger } from '@nestjs/common';
import { MatchPlatform, MatchStatus } from '@sgaob/shared';
import { MatchSyncProvider, ExternalMatch } from './match-sync.interface';

@Injectable()
export class MockSyncProvider implements MatchSyncProvider {
  readonly platform: MatchPlatform = MatchPlatform.SWISH;
  private readonly logger = new Logger(MockSyncProvider.name);

  // Fixture base de clubes y recintos chilenos para simulación hiperrealista
  private readonly tournaments = [
    { name: 'Liga Nacional de Básquetbol (LNB)', category: 'Adulto Varones' },
    { name: 'Liga Nacional Femenina (LNF)', category: 'Adulto Damas' },
    { name: 'Copa Soprole Básquetbol Escolar', category: 'Sub-18 Varones' },
    { name: 'Campeonato Metropolitano FENAUDE', category: 'Universitario Varones' },
  ];

  private readonly teams = [
    'Universidad Católica',
    'Colegio Los Leones',
    'CD Manquehue',
    'Boston College Maipú',
    'Sportiva Italiana',
    'Municipal Puente Alto',
    'CD Valdivia',
    'ABA Ancud',
    'Universidad de Concepción',
    'Club Deportivo Brisas',
    'Universidad de Chile',
    'Stadio Italiano',
  ];

  private readonly venues = [
    'Estadio Palestino, Las Condes',
    'Gimnasio Boston College, Maipú',
    'Gimnasio Municipal de San Bernardo',
    'Gimnasio Club Providencia',
    'Gimnasio Polideportivo Sergio Livingstone, Peñalolén',
    'Centro de Entrenamiento Olímpico (CEO), Ñuñoa',
  ];

  async testConnection(): Promise<{ success: boolean; message: string }> {
    this.logger.log('Verificando conexión MockSyncProvider: Activo en modo Sandbox');
    return {
      success: true,
      message: 'Conexión exitosa al entorno Sandbox/Mock de Swish/NBN23 (Sin costo)',
    };
  }

  async fetchMatches(options?: { fromDate?: Date; toDate?: Date }): Promise<ExternalMatch[]> {
    this.logger.log('Generando fixture simulado de básquetbol nacional...');
    const now = new Date();
    const matches: ExternalMatch[] = [];

    // Generar 12 partidos distribuidos en los próximos 10 días
    for (let i = 0; i < 12; i++) {
      const targetDate = new Date(now);
      targetDate.setDate(now.getDate() + Math.floor(i / 2) + 1);

      // Distinguir entre fin de semana y día hábil para horarios realistas
      const isWeekend = targetDate.getDay() === 0 || targetDate.getDay() === 6;
      const hour = isWeekend
        ? (i % 2 === 0 ? 10 + (i % 4) : 16 + (i % 4)) // Fines de semana: 10:00 o 16:00
        : (i % 2 === 0 ? 16 + (i % 3) : 19 + (i % 3)); // Días laborales: 16:00 o 19:30
      const minute = i % 2 === 0 ? 0 : 30;

      targetDate.setHours(hour, minute, 0, 0);

      const tournamentInfo = this.tournaments[i % this.tournaments.length];
      const homeTeam = this.teams[(i * 2) % this.teams.length];
      const awayTeam = this.teams[(i * 2 + 1) % this.teams.length];
      const venue = this.venues[i % this.venues.length];

      // Estado programado por defecto, y uno o dos con estados especiales para probar RF10
      let status = MatchStatus.SCHEDULED;
      if (i === 10) status = MatchStatus.RESCHEDULED;
      if (i === 11) status = MatchStatus.SUSPENDED;

      matches.push({
        externalId: `SWISH-CHL-${1000 + i}`,
        platform: MatchPlatform.SWISH,
        tournament: tournamentInfo.name,
        category: tournamentInfo.category,
        homeTeam,
        awayTeam,
        venue,
        matchDateTime: targetDate,
        status,
        rawMetadata: {
          syncedFrom: 'Swish/NBN23 Mock Provider',
          round: `Fecha ${Math.floor(i / 2) + 1}`,
          competitionCode: `CHL-2026-${i % 4}`,
        },
      });
    }

    return matches;
  }
}
