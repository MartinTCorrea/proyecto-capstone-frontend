import { apiClient } from './client';
import {
  MatchRole,
  NominationStatus,
  RoleName,
  AvailabilityBlock,
  MatchTimeBlock,
  MatchPlatform,
  MatchStatus,
} from '@sgaob/shared';

export interface CandidateItem {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  roles: RoleName[];
  declaredBlock: AvailabilityBlock;
  isAvailable: boolean;
  isAssignedToThisMatch: boolean;
  hasConflict: boolean;
  conflictDetail?: string | null;
  unavailableReason?: string;
}

export interface AvailableCandidatesResponse {
  match: {
    id: string;
    tournament: string;
    category: string;
    teams: string;
    venue: string;
    matchDateTime: string;
    timeBlock: MatchTimeBlock;
  };
  requestedSlot: MatchRole;
  requiredSystemRole: RoleName;
  counts: {
    totalActiveWithRole: number;
    availableCount: number;
    unavailableCount: number;
  };
  availableCandidates: CandidateItem[];
  unavailableCandidates: CandidateItem[];
}

export interface NominationItem {
  id: string;
  matchId: string;
  userId: string;
  matchRole: MatchRole;
  status: NominationStatus;
  rejectionReason?: string | null;
  notifiedAt?: string | null;
  respondedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string | null;
    roles?: { role: { name: RoleName } }[];
  };
  match?: {
    id: string;
    externalId: string;
    platform: MatchPlatform;
    tournament: string;
    category: string;
    homeTeam: string;
    awayTeam: string;
    venue: string;
    matchDateTime: string;
    status: MatchStatus;
    timeBlock: MatchTimeBlock;
  };
}

export interface NominationsPaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface NominationsResponse {
  data: NominationItem[];
  meta: NominationsPaginationMeta;
}

export interface QueryNominationsParams {
  matchId?: string;
  userId?: string;
  status?: NominationStatus;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface CreateNominationPayload {
  matchId: string;
  userId: string;
  matchRole: MatchRole;
  overrideAvailability?: boolean;
  overrideReason?: string;
}

export interface RespondNominationPayload {
  status: NominationStatus;
  rejectionReason?: string;
}

export const nominationsApi = {
  /**
   * Obtiene la lista de nominaciones con filtros y paginación (RF16)
   */
  async getNominations(params: QueryNominationsParams = {}): Promise<NominationsResponse> {
    const query = new URLSearchParams();
    if (params.matchId) query.append('matchId', params.matchId);
    if (params.userId) query.append('userId', params.userId);
    if (params.status) query.append('status', params.status);
    if (params.startDate) query.append('startDate', params.startDate);
    if (params.endDate) query.append('endDate', params.endDate);
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());

    const url = `/nominations${query.toString() ? `?${query.toString()}` : ''}`;
    const response = await apiClient.get<NominationsResponse>(url);
    return response.data;
  },

  /**
   * Consulta candidatos idóneos para un slot evaluando rol, disponibilidad y conflictos (CU-07)
   */
  async getAvailableCandidates(matchId: string, matchRole: MatchRole): Promise<AvailableCandidatesResponse> {
    const response = await apiClient.get<AvailableCandidatesResponse>(
      `/nominations/available-candidates?matchId=${matchId}&matchRole=${matchRole}`,
    );
    return response.data;
  },

  /**
   * Obtiene el detalle de una nominación por ID
   */
  async getNominationById(id: string): Promise<NominationItem> {
    const response = await apiClient.get<NominationItem>(`/nominations/${id}`);
    return response.data;
  },

  /**
   * Asigna un árbitro u oficial a un partido (RF11, RF12, RF13, Anexo A.1, A.2)
   */
  async createNomination(payload: CreateNominationPayload): Promise<NominationItem> {
    const response = await apiClient.post<NominationItem>('/nominations', payload);
    return response.data;
  },

  /**
   * Responde a una nominación: Confirmar o Rechazar (RF15, CU-08)
   */
  async respondNomination(id: string, payload: RespondNominationPayload): Promise<NominationItem> {
    const response = await apiClient.patch<NominationItem>(`/nominations/${id}/respond`, payload);
    return response.data;
  },

  /**
   * Revoca o elimina una nominación (Comisión Técnica)
   */
  async deleteNomination(id: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.delete<{ success: boolean; message: string }>(`/nominations/${id}`);
    return response.data;
  },
};
