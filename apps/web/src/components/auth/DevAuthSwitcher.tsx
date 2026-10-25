import React, { useState } from 'react';
import { RoleName } from '@sgaob/shared';
import { useAuth } from '../../hooks/useAuth';
import { Shield, UserCheck, Users, ChevronUp, ChevronDown, RefreshCw } from 'lucide-react';

interface MockProfile {
  label: string;
  description: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: RoleName[];
  badgeColor: string;
}

const DEV_PROFILES: MockProfile[] = [
  {
    label: 'Admin Comisión Técnica',
    description: 'Gestión total, asignación de roles y partidos',
    email: 'admin.comision@sgaob.cl',
    firstName: 'Martín',
    lastName: 'Correa',
    roles: [RoleName.ADMIN_COMISION_TECNICA],
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-slate-800 dark:text-purple-300 dark:border-purple-800/40',
  },
  {
    label: 'Árbitro de Campo',
    description: 'Declaración de disponibilidad y nominaciones',
    email: 'carlos.arbitro@sgaob.cl',
    firstName: 'Carlos',
    lastName: 'Pérez',
    roles: [RoleName.ARBITRO],
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-slate-800 dark:text-blue-300 dark:border-blue-800/40',
  },
  {
    label: 'Oficial de Mesa',
    description: 'Disponibilidad y designaciones de mesa técnica',
    email: 'ana.oficial@sgaob.cl',
    firstName: 'Ana',
    lastName: 'Gómez',
    roles: [RoleName.OFICIAL_MESA],
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-slate-800 dark:text-amber-300 dark:border-amber-800/40',
  },
  {
    label: 'Doble Rol (Árbitro + Mesa)',
    description: 'Acreditaciones técnicas simultáneas e independientes',
    email: 'mario.doble@sgaob.cl',
    firstName: 'Mario',
    lastName: 'Silva',
    roles: [RoleName.ARBITRO, RoleName.OFICIAL_MESA],
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-slate-800 dark:text-emerald-300 dark:border-emerald-800/40',
  },
  {
    label: 'Usuario sin Rol (Pendiente)',
    description: 'Usuario registrado pendiente de asignación de funciones',
    email: 'lucas.nuevo@sgaob.cl',
    firstName: 'Lucas',
    lastName: 'Valenzuela',
    roles: [],
    badgeColor: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
  },
];

export const DevAuthSwitcher: React.FC = () => {
  const { user, loginWithDevToken, isLoading } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [switching, setSwitching] = useState<string | null>(null);

  const handleSelectProfile = async (profile: MockProfile) => {
    try {
      setSwitching(profile.email);
      await loginWithDevToken({
        email: profile.email,
        firstName: profile.firstName,
        lastName: profile.lastName,
        roles: profile.roles,
      });
      setIsOpen(false);
    } catch (err) {
      console.error('Error al cambiar de perfil de desarrollo:', err);
    } finally {
      setSwitching(null);
    }
  };

  return (
    <aside
      aria-label="Panel de cambio rápido de perfil de usuario"
      className="fixed bottom-4 right-4 z-50 max-w-sm w-full font-sans"
    >
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden transition-all duration-200">
        {/* Barra superior de control */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-900 dark:bg-slate-950 text-white hover:bg-slate-800 dark:hover:bg-slate-900 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          aria-expanded={isOpen}
        >
          <div className="flex items-center space-x-2">
            <Shield className="w-4 h-4 text-amber-400" />
            <span>Simulador de Roles</span>
          </div>
          {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </button>

        {/* Contenido desplegable */}
        {isOpen && (
          <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 max-h-96 overflow-y-auto space-y-3">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
              Selecciona un perfil operativo para validar en tiempo real los permisos RBAC y la experiencia del usuario:
            </p>

            <div className="space-y-2">
              {DEV_PROFILES.map((profile) => {
                const isCurrent = user?.email === profile.email;
                const isBusy = switching === profile.email || isLoading;

                return (
                  <button
                    key={profile.email}
                    onClick={() => handleSelectProfile(profile)}
                    disabled={isBusy || isCurrent}
                    className={`w-full text-left p-2.5 rounded-md border text-xs transition-all flex flex-col space-y-1 ${
                      isCurrent
                        ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-400 dark:border-blue-700 shadow-sm'
                        : 'bg-white dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700/80 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-1.5">
                        {profile.roles.includes(RoleName.ADMIN_COMISION_TECNICA) ? (
                          <Shield className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                        ) : profile.roles.length > 1 ? (
                          <Users className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <UserCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        )}
                        <span>{profile.label}</span>
                      </span>
                      {isCurrent && (
                        <span className="text-2xs uppercase font-bold text-brand-700 dark:text-brand-300 bg-brand-100 dark:bg-brand-950/60 px-1.5 py-0.5 rounded">
                          Activo
                        </span>
                      )}
                      {switching === profile.email && (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-brand-600 dark:text-brand-400" />
                      )}
                    </div>
                    <span className="text-slate-500 dark:text-slate-400 text-caption">{profile.description}</span>
                    <span className="text-slate-400 dark:text-slate-500 text-2xs font-mono">{profile.email}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

export default DevAuthSwitcher;
