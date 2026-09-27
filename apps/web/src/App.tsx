import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { RoleName } from '@sgaob/shared';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { RoleGuard } from './components/auth/RoleGuard';
import { MainLayout } from './components/layout/MainLayout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { UnauthorizedPage } from './pages/UnauthorizedPage';
import { UsersManagementPlaceholder } from './pages/UsersManagementPlaceholder';
import { AvailabilityPlaceholder } from './pages/AvailabilityPlaceholder';
import { NominationsPlaceholder } from './pages/NominationsPlaceholder';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Ruta Pública de Login / Acceso Dev */}
          <Route path="/login" element={<LoginPage />} />

          {/* Rutas Privadas dentro del Layout Principal */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            {/* Dashboard Principal */}
            <Route index element={<DashboardPage />} />

            {/* Gestión de Usuarios: solo para Comisión Técnica */}
            <Route
              path="usuarios"
              element={
                <RoleGuard roles={[RoleName.ADMIN_COMISION_TECNICA]}>
                  <UsersManagementPlaceholder />
                </RoleGuard>
              }
            />

            {/* Disponibilidad: para Árbitros u Oficiales de Mesa */}
            <Route
              path="disponibilidad"
              element={
                <RoleGuard roles={[RoleName.ARBITRO, RoleName.OFICIAL_MESA]}>
                  <AvailabilityPlaceholder />
                </RoleGuard>
              }
            />

            {/* Nominaciones */}
            <Route path="nominaciones" element={<NominationsPlaceholder />} />

            {/* Pantalla 403 Forbidden */}
            <Route path="unauthorized" element={<UnauthorizedPage />} />
          </Route>

          {/* Fallback de redirección */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
