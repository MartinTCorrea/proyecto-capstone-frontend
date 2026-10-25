import React, { useState } from 'react';
import { RoleName } from '@sgaob/shared';
import { useAuth } from '../hooks/useAuth';
import { AdminDashboardView } from '../components/dashboard/AdminDashboardView';
import { RefereeDashboardView } from '../components/dashboard/RefereeDashboardView';
import {
  Shield,
  UserCheck,
  AlertTriangle,
  Calendar,
  Layers,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user, hasRole } = useAuth();

  const isAdmin = hasRole(RoleName.ADMIN_COMISION_TECNICA);
  const isArbitro = hasRole(RoleName.ARBITRO);
  const isOficial = hasRole(RoleName.OFICIAL_MESA);
  const isTechnicalPersonnel = isArbitro || isOficial;
  const isDualRole = isAdmin && isTechnicalPersonnel;

  // Si tiene ambos roles, por defecto muestra la vista de Admin pero permite alternar
  const [activeTab, setActiveTab] = useState<'ADMIN' | 'REFEREE'>(
    isAdmin ? 'ADMIN' : 'REFEREE',
  );

  if (!user) return null;

  const todayFormatted = new Date().toLocaleDateString('es-CL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="space-y-8">
      {/* Cabecera Principal de Bienvenida */}
      <section className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 sm:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 transition-colors duration-200">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-slate-800 px-2.5 py-0.5 rounded-full inline-block border dark:border-blue-900/40">
              Sesión Activa
            </span>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 capitalize flex items-center">
              <Calendar className="w-3.5 h-3.5 mr-1 text-slate-400 dark:text-slate-500" />
              {todayFormatted}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Hola, {user.firstName} {user.lastName}
          </h1>

          <p className="text-slate-600 dark:text-slate-400 text-sm">
            {isAdmin
              ? 'Panel operativo de la Comisión Técnica: supervisa disponibilidad, cartelera y designaciones.'
              : 'Panel personal de árbitros y oficiales: gestiona tu disponibilidad semanal y partidos asignados.'}
          </p>
        </div>

        <div className="flex flex-col items-start md:items-end gap-3">
          {/* Badges de Roles del Usuario */}
          <div className="flex flex-wrap gap-2">
            {user.roles && user.roles.length > 0 ? (
              user.roles.map((r) => (
                <span
                  key={r}
                  className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-slate-900 dark:bg-slate-800 text-white border dark:border-slate-700 shadow-sm"
                >
                  {r === RoleName.ADMIN_COMISION_TECNICA && (
                    <Shield className="w-3.5 h-3.5 mr-1.5 text-purple-400" />
                  )}
                  {r === RoleName.ARBITRO && (
                    <UserCheck className="w-3.5 h-3.5 mr-1.5 text-blue-400" />
                  )}
                  {r === RoleName.OFICIAL_MESA && (
                    <UserCheck className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
                  )}
                  {r === RoleName.ADMIN_COMISION_TECNICA
                    ? 'Comisión Técnica'
                    : r === RoleName.ARBITRO
                    ? 'Árbitro'
                    : 'Oficial de Mesa'}
                </span>
              ))
            ) : (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 dark:bg-slate-800 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40">
                <AlertTriangle className="w-3.5 h-3.5 mr-1.5" />
                Acreditación Pendiente
              </span>
            )}
          </div>

          {/* Selector de Modo para Usuarios con Doble Rol */}
          {isDualRole && (
            <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setActiveTab('ADMIN')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                  activeTab === 'ADMIN'
                    ? 'bg-white dark:bg-slate-900 text-purple-800 dark:text-purple-300 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Shield className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                <span>Comisión Técnica</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('REFEREE')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                  activeTab === 'REFEREE'
                    ? 'bg-white dark:bg-slate-900 text-blue-800 dark:text-blue-300 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>Mi Perfil Arbitral</span>
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Contenido Dinámico según Rol y Pestaña Activa */}
      {isAdmin && activeTab === 'ADMIN' ? (
        <AdminDashboardView />
      ) : isTechnicalPersonnel ? (
        <RefereeDashboardView />
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center space-y-3 transition-colors duration-200">
          <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
            Acreditación Técnica en Proceso
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
            Tu cuenta se encuentra registrada y habilitada en el sistema, pero aún no tiene acreditaciones asignadas de árbitro u oficial de mesa.
            Comunícate con la Comisión Técnica para habilitar tus funciones operativas.
          </p>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
