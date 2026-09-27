import { apiClient } from './client';
import { UserDto, RoleName } from '@sgaob/shared';

export interface DevTokenPayload {
  email: string;
  firstName?: string;
  lastName?: string;
  roles?: RoleName[];
}

export interface DevTokenResponse {
  accessToken: string;
  user: UserDto;
}

export const authApi = {
  /**
   * Obtiene el perfil del usuario autenticado actual desde /api/auth/me
   */
  async getProfile(): Promise<UserDto> {
    const response = await apiClient.get<UserDto>('/auth/me');
    return response.data;
  },

  /**
   * Genera un token JWT de prueba para desarrollo local desde /api/auth/dev-token
   */
  async getDevToken(payload: DevTokenPayload): Promise<DevTokenResponse> {
    const response = await apiClient.post<DevTokenResponse>('/auth/dev-token', payload);
    return response.data;
  },
};
