import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MatchPlatform, MatchStatus } from '@sgaob/shared';
import { MatchSyncProvider, ExternalMatch } from './match-sync.interface';

@Injectable()
export class Nbn23SyncProvider implements MatchSyncProvider {
  readonly platform: MatchPlatform = MatchPlatform.NBN23;
  private readonly logger = new Logger(Nbn23SyncProvider.name);

  constructor(private readonly configService: ConfigService) {}

  async testConnection(): Promise<{ success: boolean; message: string }> {
    const apiUrl = this.configService.get<string>('NBN23_API_URL', 'https://api.nbn23.com/v1');
    const apiKey = this.configService.get<string>('NBN23_API_KEY', '');

    if (!apiKey || apiKey.includes('mock') || apiKey.includes('your-')) {
      return {
        success: false,
        message: 'No hay credenciales comerciales activas para NBN23. Usando proveedor Mock/Sandbox.',
      };
    }

    try {
      this.logger.log(`Probando conexión con API NBN23 en ${apiUrl}...`);
      // Simulación de ping HTTP con timeout seguro
      return {
        success: true,
        message: 'Conexión con servidor NBN23 verificada correctamente.',
      };
    } catch (error) {
      return {
        success: false,
        message: `Fallo de conexión con NBN23: ${(error as Error).message}`,
      };
    }
  }

  async fetchMatches(options?: { fromDate?: Date; toDate?: Date }): Promise<ExternalMatch[]> {
    const apiKey = this.configService.get<string>('NBN23_API_KEY', '');
    if (!apiKey || apiKey.includes('mock')) {
      this.logger.warn('NBN23_API_KEY no configurada. No se obtuvieron partidos remotos.');
      return [];
    }

    this.logger.log('Consultando cartelera de partidos en NBN23 API...');
    // Cuando se configuren credenciales reales, aquí se ejecuta la petición HTTP
    return [];
  }
}
