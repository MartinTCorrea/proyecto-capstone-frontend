import { apiClient } from './client';
import { AvailabilityBlock, RoleName, TimeBlockConfigDto } from '@sgaob/shared';

export interface DailyAvailabilityEntry {
  date: string; // YYYY-MM-DD
  block: AvailabilityBlock;
}

export interface UserAvailabilityRecord {
  id: string;
  userId: string;
  date: string;
  block: AvailabilityBlock;
  createdAt: string;
  updatedAt: string;
}

export interface AvailabilitySummaryResponse {
  date: string;
  totalAvailable: number;
  counts: {
    HORARIO_1: number;
    HORARIO_2: number;
    FULL: number;
    NO: number;
  };
  personnel: Array<{
    availabilityId: string;
    userId: string;
    fullName: string;
    email: string;
    phone?: string | null;
    block: AvailabilityBlock;
    roles: RoleName[];
  }>;
}

export const availabilityApi = {
  /**
   * Obtiene la configuración de bloques horarios parametrizados (Anexo A.4)
   */
  async getTimeBlocks(): Promise<TimeBlockConfigDto[]> {
    const response = await apiClient.get<TimeBlockConfigDto[]>('/availability/blocks');
    return response.data;
  },

  /**
   * Actualiza los límites de un bloque horario (exclusivo Comisión Técnica)
   */
  async updateTimeBlock(
    id: string,
    data: { startTime?: string; endTime?: string; description?: string },
  ): Promise<TimeBlockConfigDto> {
    const response = await apiClient.patch<TimeBlockConfigDto>(`/availability/blocks/${id}`, data);
    return response.data;
  },

  /**
   * Obtiene la disponibilidad declarada por el usuario autenticado (RF06)
   */
  async getMyAvailability(params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<UserAvailabilityRecord[]> {
    const response = await apiClient.get<UserAvailabilityRecord[]>('/availability/my', {
      params,
    });
    return response.data;
  },

  /**
   * Declara o actualiza masivamente la disponibilidad semanal (RF04, RF05)
   */
  async declareBulk(
    availabilities: DailyAvailabilityEntry[],
  ): Promise<UserAvailabilityRecord[]> {
    const response = await apiClient.post<UserAvailabilityRecord[]>('/availability/bulk', {
      availabilities,
    });
    return response.data;
  },

  /**
   * Consulta el consolidado de disponibilidad para la Comisión Técnica (RF06)
   */
  async getAvailabilitySummary(params: {
    date: string;
    block?: AvailabilityBlock;
    role?: RoleName;
  }): Promise<AvailabilitySummaryResponse> {
    const response = await apiClient.get<AvailabilitySummaryResponse>(
      '/availability/summary',
      { params },
    );
    return response.data;
  },
};
