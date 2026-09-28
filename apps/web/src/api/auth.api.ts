import { apiClient } from './client';
import { UserDto, RoleName } from '@sgaob/shared';

export interface DevTokenPayload {
  email: string;
  firstName?: string;
  lastName?: string;
  roles?: RoleName[];
}

export interface CognitoLoginPayload {
  email: string;
  password: string;
}

export interface CognitoConfigResponse {
  authProvider: string;
  region: string;
  userPoolId: string;
  clientId: string;
  isConfigured: boolean;
  hostedUiUrl?: string;
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

  /**
   * Autentica un usuario contra AWS Cognito mediante /api/auth/cognito-login
   */
  async loginCognito(payload: CognitoLoginPayload): Promise<DevTokenResponse> {
    const response = await apiClient.post<DevTokenResponse>('/auth/cognito-login', payload);
    return response.data;
  },

  /**
   * Obtiene la configuración de AWS Cognito y estado desde /api/auth/cognito-config
   */
  async getCognitoConfig(): Promise<CognitoConfigResponse> {
    const response = await apiClient.get<CognitoConfigResponse>('/auth/cognito-config');
    return response.data;
  },
};
