import React, { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import { UserDto, RoleName } from '@sgaob/shared';
import { authApi, DevTokenPayload } from '../api/auth.api';

export interface AuthContextType {
  user: UserDto | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasRole: (...roles: RoleName[]) => boolean;
  loginWithDevToken: (payload: DevTokenPayload) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserDto | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('sgaob_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const logout = useCallback(() => {
    localStorage.removeItem('sgaob_token');
    setToken(null);
    setUser(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    const currentToken = localStorage.getItem('sgaob_token');
    if (!currentToken) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const profile = await authApi.getProfile();
      setUser(profile);
    } catch (error) {
      console.error('Error al sincronizar el perfil de usuario:', error);
      logout();
    } finally {
      setIsLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  const loginWithDevToken = useCallback(
    async (payload: DevTokenPayload) => {
      setIsLoading(true);
      try {
        const response = await authApi.getDevToken(payload);
        localStorage.setItem('sgaob_token', response.accessToken);
        setToken(response.accessToken);
        setUser(response.user);
      } catch (error) {
        console.error('Error en autenticación dev-token:', error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const hasRole = useCallback(
    (...roles: RoleName[]): boolean => {
      if (!user || !user.roles) return false;
      return roles.some((role) => user.roles.includes(role));
    },
    [user],
  );

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      token,
      isAuthenticated: !!user && !!token,
      isLoading,
      hasRole,
      loginWithDevToken,
      logout,
      refreshProfile,
    }),
    [user, token, isLoading, hasRole, loginWithDevToken, logout, refreshProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
