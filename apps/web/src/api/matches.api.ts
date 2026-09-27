import { apiClient } from './client';
import {
  MatchPlatform,
  MatchStatus,
  MatchTimeBlock,
  NominationDto,
} from '@sgaob/shared';

export interface MatchItem {
  id: string;
  externalId: string;
  platform: MatchPlatform;
  timeBlock: MatchTimeBlock;
  tournament: string;
  category: string;
  homeTeam: string;
  awayTeam: string;
  venue: string;
  matchDateTime: string;
  status: MatchStatus;
  rawMetadata?: Record<string, any>;
  nominations?: NominationDto[];
  createdAt: string;
  updatedAt: string;
}

export interface MatchesPaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface MatchesResponse {
  data: MatchItem[];
  meta: MatchesPaginationMeta;
}

export interface QueryMatchesParams {
  startDate?: string;
  endDate?: string;
  tournament?: string;
  venue?: string;
  status?: MatchStatus;
  platform?: MatchPlatform;
  timeBlock?: MatchTimeBlock;
  page?: number;
  limit?: number;
}

export interface CreateMatchPayload {
  tournament: string;
  category: string;
  homeTeam: string;
  awayTeam: string;
  venue: string;
  matchDateTime: string;
  status?: MatchStatus;
  timeBlock?: MatchTimeBlock;
  platform?: MatchPlatform;
  externalId?: string;
  rawMetadata?: Record<string, any>;
}

export interface UpdateMatchPayload {
  tournament?: string;
  category?: string;
  homeTeam?: string;
  awayTeam?: string;
  venue?: string;
  matchDateTime?: string;
  status?: MatchStatus;
  timeBlock?: MatchTimeBlock;
  rawMetadata?: Record<string, any>;
}

export interface SyncMatchesPayload {
  platform?: MatchPlatform;
  mock?: boolean;
}

export interface SyncResponse {
  success: boolean;
  message: string;
  jobId: string;
  status: string;
  mode: string;
}

export interface TestIntegrationResponse {
  success: boolean;
  message: string;
}

export const matchesApi = {
  /**
   * Obtiene la cartelera de partidos con filtros y paginación
   */
  async getMatches(params: QueryMatchesParams = {}): Promise<MatchesResponse> {
    const query = new URLSearchParams();
    if (params.startDate) query.append('startDate', params.startDate);
    if (params.endDate) query.append('endDate', params.endDate);
    if (params.tournament) query.append('tournament', params.tournament);
    if (params.venue) query.append('venue', params.venue);
    if (params.status) query.append('status', params.status);
    if (params.platform) query.append('platform', params.platform);
    if (params.timeBlock) query.append('timeBlock', params.timeBlock);
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());

    const url = `/matches${query.toString() ? `?${query.toString()}` : ''}`;
    const response = await apiClient.get<MatchesResponse>(url);
    return response.data;
  },

  /**
   * Obtiene el detalle de un partido por su ID
   */
  async getMatchById(id: string): Promise<MatchItem> {
    const response = await apiClient.get<MatchItem>(`/matches/${id}`);
    return response.data;
  },

  /**
   * Crea un partido manualmente (Comisión Técnica / 100% Autónomo)
   */
  async createMatch(payload: CreateMatchPayload): Promise<MatchItem> {
    const response = await apiClient.post<MatchItem>('/matches', payload);
    return response.data;
  },

  /**
   * Actualiza los datos o estado de un partido (RF10)
   */
  async updateMatch(id: string, payload: UpdateMatchPayload): Promise<MatchItem> {
    const response = await apiClient.patch<MatchItem>(`/matches/${id}`, payload);
    return response.data;
  },

  /**
   * Elimina un partido manual
   */
  async deleteMatch(id: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.delete<{ success: boolean; message: string }>(`/matches/${id}`);
    return response.data;
  },

  /**
   * Dispara una sincronización bajo demanda (RF09)
   */
  async triggerSync(payload: SyncMatchesPayload = {}): Promise<SyncResponse> {
    const response = await apiClient.post<SyncResponse>('/matches/sync', payload);
    return response.data;
  },

  /**
   * Prueba conectividad con plataforma de sincronización (RF07)
   */
  async testIntegration(platform: MatchPlatform = MatchPlatform.SWISH): Promise<TestIntegrationResponse> {
    const response = await apiClient.get<TestIntegrationResponse>(
      `/matches/integrations/test?platform=${platform}`,
    );
    return response.data;
  },
};
