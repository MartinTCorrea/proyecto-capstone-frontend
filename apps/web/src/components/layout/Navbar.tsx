import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { RoleName } from '@sgaob/shared';
import { useAuth } from '../../hooks/useAuth';
import { User, LogOut, Menu, X, Calendar, ClipboardList, Users, Trophy, FolderArchive } from 'lucide-react';
import { BasketballLogo } from '../common/BasketballLogo';
import { ThemeToggle } from '../common/ThemeToggle';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, hasRole, logout } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const roleBadgeMap: Record<RoleName, { label: string; color: string }> = {
    [RoleName.ADMIN_COMISION_TECNICA]: {
      label: 'Comisión Técnica',
      color: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-slate-800 dark:text-purple-300 dark:border-purple-800/40',
    },
    [RoleName.ARBITRO]: {
      label: 'Árbitro',
      color: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-slate-800 dark:text-blue-300 dark:border-blue-800/40',
    },
    [RoleName.OFICIAL_MESA]: {
      label: 'Oficial de Mesa',
      color: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-slate-800 dark:text-amber-300 dark:border-amber-800/40',
    },
  };

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo y Navegación Principal */}
          <div className="flex items-center space-x-8">
            <Link to="/" className="flex items-center space-x-3 group focus:outline-none">
              <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-md group-hover:bg-blue-700 transition-colors">
                <BasketballLogo className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-lg tracking-tight text-slate-900 dark:text-white leading-tight">
                  SGAOB
                </span>
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 hidden sm:inline">
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
                      ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 font-semibold'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  Inicio
                </Link>

                {hasRole(RoleName.ADMIN_COMISION_TECNICA) && (
                  <Link
                    to="/usuarios"
                    className={`flex items-center space-x-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive('/usuarios')
                        ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 font-semibold'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <span>Gestión de Usuarios</span>
                  </Link>
                )}

                {(hasRole(RoleName.ARBITRO) || hasRole(RoleName.OFICIAL_MESA)) && (
                  <Link
                    to="/disponibilidad"
                    className={`flex items-center space-x-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive('/disponibilidad')
                        ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 font-semibold'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span>Disponibilidad</span>
                  </Link>
                )}

                <Link
                  to="/partidos"
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/partidos')
                      ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 font-semibold'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <Trophy className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                  <span>Partidos</span>
                </Link>

                <Link
                  to="/nominaciones"
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/nominaciones')
                      ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 font-semibold'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <ClipboardList className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Nominaciones</span>
                </Link>

                <Link
                  to="/recursos"
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/recursos')
                      ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 font-semibold'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <FolderArchive className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <span>Recursos</span>
                </Link>
              </nav>
            )}
          </div>

          {/* Sección de Usuario / Autenticación y Switch de Tema */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {isAuthenticated && user ? (
              <div className="flex items-center space-x-2 sm:space-x-3">
                <Link
                  to="/perfil"
                  title="Ver Mi Perfil"
                  className="hidden lg:flex flex-col items-end group p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {user.firstName} {user.lastName}
                    </span>
                    <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">({user.email})</span>
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
                      <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-full">
                        Sin roles asignados
                      </span>
                    )}
                  </div>
                </Link>

                <Link
                  to="/perfil"
                  title="Mi Perfil"
                  aria-label="Mi Perfil"
                  className={`p-2 rounded-lg transition-colors focus:ring-2 focus:ring-blue-500 cursor-pointer ${
                    isActive('/perfil')
                      ? 'text-blue-700 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-400'
                      : 'text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <User className="w-5 h-5" />
                </Link>

                {/* Switch de Modo Oscuro colocado exactamente entre el botón de Perfil y de Logout */}
                <ThemeToggle />

                <button
                  onClick={logout}
                  title="Cerrar sesión"
                  aria-label="Cerrar sesión"
                  className="p-2 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors focus:ring-2 focus:ring-rose-500 cursor-pointer"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <ThemeToggle />
                <Link
                  to="/login"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-colors cursor-pointer"
                >
                  <User className="w-4 h-4 mr-1.5" />
                  Iniciar Sesión
                </Link>
              </div>
            )}

            {/* Botón menú móvil */}
            {isAuthenticated && (
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-md cursor-pointer"
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
        <div className="md:hidden bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-4 pt-2 pb-4 space-y-1">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Inicio
          </Link>
          <Link
            to="/perfil"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800"
          >
            Mi Perfil
          </Link>
          {hasRole(RoleName.ADMIN_COMISION_TECNICA) && (
            <Link
              to="/usuarios"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-medium text-purple-700 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-slate-800"
            >
              Gestión de Usuarios
            </Link>
          )}
          {(hasRole(RoleName.ARBITRO) || hasRole(RoleName.OFICIAL_MESA)) && (
            <Link
              to="/disponibilidad"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-medium text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800"
            >
              Disponibilidad
            </Link>
          )}
          <Link
            to="/partidos"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-slate-800"
          >
            Partidos
          </Link>
          <Link
            to="/nominaciones"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-slate-800"
          >
            Nominaciones
          </Link>
          <Link
            to="/recursos"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-purple-700 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-slate-800"
          >
            Recursos
          </Link>

          {/* Toggle de tema en menú móvil */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between px-3">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Apariencia</span>
            <ThemeToggle showLabel />
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
