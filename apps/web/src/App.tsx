import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { RoleName } from '@sgaob/shared';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { RoleGuard } from './components/auth/RoleGuard';
import { MainLayout } from './components/layout/MainLayout';
import { LoadingSpinner } from './components/common/LoadingSpinner';

// Carga perezosa (Lazy Loading) de páginas por ruta para optimización de rendimiento (Paso 9)
const LoginPage = lazy(() => import('./pages/LoginPage').then((m) => ({ default: m.LoginPage })));
const DashboardPage = lazy(() => import('./pages/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const UnauthorizedPage = lazy(() => import('./pages/UnauthorizedPage').then((m) => ({ default: m.UnauthorizedPage })));
const UsersManagementPage = lazy(() => import('./pages/UsersManagementPage').then((m) => ({ default: m.UsersManagementPage })));
const AvailabilityPage = lazy(() => import('./pages/AvailabilityPage').then((m) => ({ default: m.AvailabilityPage })));
const MatchesPage = lazy(() => import('./pages/MatchesPage').then((m) => ({ default: m.MatchesPage })));
const NominationsPage = lazy(() => import('./pages/NominationsPage').then((m) => ({ default: m.NominationsPage })));
const ResourcesPage = lazy(() => import('./pages/ResourcesPage').then((m) => ({ default: m.ResourcesPage })));

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<LoadingSpinner message="Cargando módulo SGAOB..." size="lg" />}>
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
                  <UsersManagementPage />
                </RoleGuard>
              }
            />

            {/* Disponibilidad: para Árbitros, Oficiales de Mesa y Comisión Técnica */}
            <Route
              path="disponibilidad"
              element={
                <RoleGuard
                  roles={[
                    RoleName.ARBITRO,
                    RoleName.OFICIAL_MESA,
                    RoleName.ADMIN_COMISION_TECNICA,
                  ]}
                >
                  <AvailabilityPage />
                </RoleGuard>
              }
            />

            {/* Cartelera de Partidos: para Árbitros, Oficiales de Mesa y Comisión Técnica */}
            <Route
              path="partidos"
              element={
                <RoleGuard
                  roles={[
                    RoleName.ARBITRO,
                    RoleName.OFICIAL_MESA,
                    RoleName.ADMIN_COMISION_TECNICA,
                  ]}
                >
                  <MatchesPage />
                </RoleGuard>
              }
            />

            {/* Nominaciones: para Árbitros, Oficiales de Mesa y Comisión Técnica */}
            <Route
              path="nominaciones"
              element={
                <RoleGuard
                  roles={[
                    RoleName.ARBITRO,
                    RoleName.OFICIAL_MESA,
                    RoleName.ADMIN_COMISION_TECNICA,
                  ]}
                >
                  <NominationsPage />
                </RoleGuard>
              }
            />

            {/* Recursos y Comunicados */}
            <Route
              path="recursos"
              element={
                <RoleGuard
                  roles={[
                    RoleName.ARBITRO,
                    RoleName.OFICIAL_MESA,
                    RoleName.ADMIN_COMISION_TECNICA,
                  ]}
                >
                  <ResourcesPage />
                </RoleGuard>
              }
            />

            {/* Pantalla 403 Forbidden */}
            <Route path="unauthorized" element={<UnauthorizedPage />} />
          </Route>

          {/* Fallback de redirección */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
