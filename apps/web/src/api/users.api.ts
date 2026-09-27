import { apiClient } from './client';
import { UserDto, RoleName, UserStatus } from '@sgaob/shared';

export interface QueryUsersParams {
  page?: number;
  limit?: number;
  role?: RoleName;
  status?: UserStatus;
  search?: string;
}

export interface PaginatedUsersResponse {
  data: UserDto[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CreateUserPayload {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  roles?: RoleName[];
  status?: UserStatus;
}

export interface UpdateUserPayload {
  firstName?: string;
  lastName?: string;
  phone?: string;
}

export const usersApi = {
  /**
   * Obtiene la lista paginada de usuarios con filtros opcionales (RF03)
   */
  async getUsers(params: QueryUsersParams = {}): Promise<PaginatedUsersResponse> {
    const response = await apiClient.get<PaginatedUsersResponse>('/users', {
      params: {
        page: params.page || 1,
        limit: params.limit || 10,
        ...(params.role && { role: params.role }),
        ...(params.status && { status: params.status }),
        ...(params.search && { search: params.search }),
      },
    });
    return response.data;
  },

  /**
   * Obtiene el perfil de un usuario específico por su UUID (RF03)
   */
  async getUserById(id: string): Promise<UserDto> {
    const response = await apiClient.get<UserDto>(`/users/${id}`);
    return response.data;
  },

  /**
   * Crea un nuevo usuario en la base de datos (RF03, CU-02)
   */
  async createUser(payload: CreateUserPayload): Promise<UserDto> {
    const response = await apiClient.post<UserDto>('/users', payload);
    return response.data;
  },

  /**
   * Actualiza los datos personales de un usuario (RF03)
   */
  async updateUser(id: string, payload: UpdateUserPayload): Promise<UserDto> {
    const response = await apiClient.patch<UserDto>(`/users/${id}`, payload);
    return response.data;
  },

  /**
   * Asignación estricta de roles técnicos (RF02, Anexo A.1)
   */
  async assignRoles(id: string, roles: RoleName[]): Promise<UserDto> {
    const response = await apiClient.patch<UserDto>(`/users/${id}/roles`, { roles });
    return response.data;
  },

  /**
   * Habilita o suspende un perfil de usuario (RF03)
   */
  async updateStatus(id: string, status: UserStatus): Promise<UserDto> {
    const response = await apiClient.patch<UserDto>(`/users/${id}/status`, { status });
    return response.data;
  },

  /**
   * Registra el consentimiento formal de tratamiento de datos personales (RF01)
   */
  async recordConsent(): Promise<{ success: boolean; dataConsentDate: string }> {
    const response = await apiClient.post<{ success: boolean; dataConsentDate: string }>(
      '/users/consent',
      { consent: true },
    );
    return response.data;
  },
};
