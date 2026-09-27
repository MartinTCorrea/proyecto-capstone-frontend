import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { RoleName } from '@sgaob/shared';
import { useAuth } from '../../hooks/useAuth';
import { User, LogOut, Menu, X, Calendar, ClipboardList, Users } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, hasRole, logout } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const roleBadgeMap: Record<RoleName, { label: string; color: string }> = {
    [RoleName.ADMIN_COMISION_TECNICA]: {
      label: 'Comisión Técnica',
      color: 'bg-purple-100 text-purple-800 border-purple-200',
    },
    [RoleName.ARBITRO]: {
      label: 'Árbitro',
      color: 'bg-blue-100 text-blue-800 border-blue-200',
    },
    [RoleName.OFICIAL_MESA]: {
      label: 'Oficial de Mesa',
      color: 'bg-amber-100 text-amber-800 border-amber-200',
    },
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo y Navegación Principal */}
          <div className="flex items-center space-x-8">
            <Link to="/" className="flex items-center space-x-3 group focus:outline-none">
              <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-xl shadow-md group-hover:bg-blue-700 transition-colors">
                🏀
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-lg tracking-tight text-slate-900 leading-tight">
                  SGAOB
                </span>
                <span className="text-[11px] font-medium text-slate-500 hidden sm:inline">
                  Gestión Arbitral de Básquetbol
                </span>
              </div>
            </Link>

            {isAuthenticated && (
              <nav className="hidden md:flex space-x-1" aria-label="Navegación principal">
                <Link
                  to="/"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/')
                      ? 'bg-blue-50 text-blue-700 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  Inicio
                </Link>

                {hasRole(RoleName.ADMIN_COMISION_TECNICA) && (
                  <Link
                    to="/usuarios"
                    className={`flex items-center space-x-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive('/usuarios')
                        ? 'bg-blue-50 text-blue-700 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <Users className="w-4 h-4 text-purple-600" />
                    <span>Gestión de Usuarios</span>
                  </Link>
                )}

                {(hasRole(RoleName.ARBITRO) || hasRole(RoleName.OFICIAL_MESA)) && (
                  <Link
                    to="/disponibilidad"
                    className={`flex items-center space-x-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive('/disponibilidad')
                        ? 'bg-blue-50 text-blue-700 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <span>Disponibilidad</span>
                  </Link>
                )}

                <Link
                  to="/nominaciones"
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/nominaciones')
                      ? 'bg-blue-50 text-blue-700 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <ClipboardList className="w-4 h-4 text-emerald-600" />
                  <span>Nominaciones</span>
                </Link>
              </nav>
            )}
          </div>

          {/* Sección de Usuario / Autenticación */}
          <div className="flex items-center space-x-3">
            {isAuthenticated && user ? (
              <div className="flex items-center space-x-4">
                <div className="hidden lg:flex flex-col items-end">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-bold text-slate-800">
                      {user.firstName} {user.lastName}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">({user.email})</span>
                  </div>
                  <div className="flex space-x-1.5 mt-0.5">
                    {user.roles && user.roles.length > 0 ? (
                      user.roles.map((r) => {
                        const badge = roleBadgeMap[r];
                        return (
                          <span
                            key={r}
                            className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${badge?.color}`}
                          >
                            {badge?.label || r}
                          </span>
                        );
                      })
                    ) : (
                      <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                        Sin roles asignados
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={logout}
                  title="Cerrar sesión"
                  aria-label="Cerrar sesión"
                  className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors focus:ring-2 focus:ring-rose-500"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-colors"
              >
                <User className="w-4 h-4 mr-1.5" />
                Iniciar Sesión
              </Link>
            )}

            {/* Botón menú móvil */}
            {isAuthenticated && (
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-slate-600 hover:text-slate-900 rounded-md"
                aria-expanded={mobileMenuOpen}
                aria-label="Abrir menú de navegación"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Menú móvil desplegable */}
      {mobileMenuOpen && isAuthenticated && (
        <div className="md:hidden bg-slate-50 border-t border-slate-200 px-4 pt-2 pb-4 space-y-1">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-slate-800 hover:bg-slate-100"
          >
            Inicio
          </Link>
          {hasRole(RoleName.ADMIN_COMISION_TECNICA) && (
            <Link
              to="/usuarios"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-medium text-purple-700 hover:bg-purple-50"
            >
              Gestión de Usuarios
            </Link>
          )}
          {(hasRole(RoleName.ARBITRO) || hasRole(RoleName.OFICIAL_MESA)) && (
            <Link
              to="/disponibilidad"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-medium text-blue-700 hover:bg-blue-50"
            >
              Disponibilidad
            </Link>
          )}
          <Link
            to="/nominaciones"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-emerald-700 hover:bg-emerald-50"
          >
            Nominaciones
          </Link>
        </div>
      )}
    </header>
  );
};

export default Navbar;
