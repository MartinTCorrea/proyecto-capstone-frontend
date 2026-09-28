import { apiClient } from './client';
import { ResourceType, ResourceVisibility } from '@sgaob/shared';

export interface ResourceItem {
  id: string;
  type: ResourceType;
  title: string;
  description?: string | null;
  fileUrl?: string | null;
  content?: string | null;
  visibility: ResourceVisibility;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface ResourcesPaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ResourcesResponse {
  data: ResourceItem[];
  meta: ResourcesPaginationMeta;
}

export interface QueryResourcesParams {
  type?: ResourceType;
  visibility?: ResourceVisibility;
  search?: string;
  page?: number;
  limit?: number;
}

export interface CreateResourcePayload {
  type: ResourceType;
  title: string;
  description?: string;
  fileUrl?: string;
  content?: string;
  visibility?: ResourceVisibility;
}

export interface UpdateResourcePayload {
  type?: ResourceType;
  title?: string;
  description?: string;
  fileUrl?: string;
  content?: string;
  visibility?: ResourceVisibility;
}

export interface ExportNominationsParams {
  startDate?: string;
  endDate?: string;
  tournament?: string;
  venue?: string;
}

export const resourcesApi = {
  /**
   * Obtiene la lista de recursos con filtros y paginación (RF17, RF18, RF19)
   */
  async getResources(params: QueryResourcesParams = {}): Promise<ResourcesResponse> {
    const query = new URLSearchParams();
    if (params.type) query.append('type', params.type);
    if (params.visibility) query.append('visibility', params.visibility);
    if (params.search) query.append('search', params.search);
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());

    const url = `/resources${query.toString() ? `?${query.toString()}` : ''}`;
    const response = await apiClient.get<ResourcesResponse>(url);
    return response.data;
  },

  /**
   * Obtiene el detalle de un recurso por su ID
   */
  async getResourceById(id: string): Promise<ResourceItem> {
    const response = await apiClient.get<ResourceItem>(`/resources/${id}`);
    return response.data;
  },

  /**
   * Crea un nuevo documento, comunicado o credencial (Comisión Técnica)
   */
  async createResource(payload: CreateResourcePayload): Promise<ResourceItem> {
    const response = await apiClient.post<ResourceItem>('/resources', payload);
    return response.data;
  },

  /**
   * Actualiza un recurso existente
   */
  async updateResource(id: string, payload: UpdateResourcePayload): Promise<ResourceItem> {
    const response = await apiClient.patch<ResourceItem>(`/resources/${id}`, payload);
    return response.data;
  },

  /**
   * Elimina un recurso del sistema
   */
  async deleteResource(id: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.delete<{ success: boolean; message: string }>(`/resources/${id}`);
    return response.data;
  },

  /**
   * Descarga la grilla de asignaciones en formato CSV para Microsoft Excel (RF20)
   */
  async downloadNominationsCsv(params: ExportNominationsParams = {}): Promise<void> {
    const query = new URLSearchParams();
    if (params.startDate) query.append('startDate', params.startDate);
    if (params.endDate) query.append('endDate', params.endDate);
    if (params.tournament) query.append('tournament', params.tournament);
    if (params.venue) query.append('venue', params.venue);

    const url = `/resources/export/nominations${query.toString() ? `?${query.toString()}` : ''}`;
    const response = await apiClient.get(url, {
      responseType: 'blob',
    });

    // Crear un blob y descargar en el navegador del usuario
    const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    const dateStr = new Date().toISOString().split('T')[0];
    link.setAttribute('download', `asignaciones-sgaob-${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);
  },
};
