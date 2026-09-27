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
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
  },
  {
    label: 'Árbitro de Campo',
    description: 'Declaración de disponibilidad y nominaciones',
    email: 'carlos.arbitro@sgaob.cl',
    firstName: 'Carlos',
    lastName: 'Pérez',
    roles: [RoleName.ARBITRO],
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
  },
  {
    label: 'Oficial de Mesa',
    description: 'Disponibilidad y designaciones de mesa técnica',
    email: 'ana.oficial@sgaob.cl',
    firstName: 'Ana',
    lastName: 'Gómez',
    roles: [RoleName.OFICIAL_MESA],
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
  },
  {
    label: 'Doble Rol (Árbitro + Mesa)',
    description: 'Demuestra la independencia técnica (Anexo A.1)',
    email: 'mario.doble@sgaob.cl',
    firstName: 'Mario',
    lastName: 'Silva',
    roles: [RoleName.ARBITRO, RoleName.OFICIAL_MESA],
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  },
  {
    label: 'Usuario sin Rol (Pendiente)',
    description: 'Usuario pre-registrado esperando acreditación',
    email: 'lucas.nuevo@sgaob.cl',
    firstName: 'Lucas',
    lastName: 'Valenzuela',
    roles: [],
    badgeColor: 'bg-slate-100 text-slate-700 border-slate-200',
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
      aria-label="Panel de cambio de rol para desarrollo y evaluación"
      className="fixed bottom-4 right-4 z-50 max-w-sm w-full font-sans"
    >
      <div className="bg-white rounded-lg shadow-xl border border-slate-200 overflow-hidden transition-all">
        {/* Barra superior de control */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-900 text-white hover:bg-slate-800 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-expanded={isOpen}
        >
          <div className="flex items-center space-x-2">
            <Shield className="w-4 h-4 text-amber-400" />
            <span>Dev Switcher (Modo Capstone)</span>
          </div>
          {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </button>

        {/* Contenido desplegable */}
        {isOpen && (
          <div className="p-4 bg-slate-50 border-t border-slate-200 max-h-96 overflow-y-auto space-y-3">
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              Selecciona un perfil preconfigurado para probar en tiempo real las reglas de autorización RBAC y la vista del sistema:
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
                        ? 'bg-blue-50 border-blue-400 shadow-sm'
                        : 'bg-white hover:bg-slate-100 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-bold text-slate-800 flex items-center space-x-1.5">
                        {profile.roles.includes(RoleName.ADMIN_COMISION_TECNICA) ? (
                          <Shield className="w-3.5 h-3.5 text-purple-600" />
                        ) : profile.roles.length > 1 ? (
                          <Users className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                        )}
                        <span>{profile.label}</span>
                      </span>
                      {isCurrent && (
                        <span className="text-[10px] uppercase font-bold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded">
                          Activo
                        </span>
                      )}
                      {switching === profile.email && (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
                      )}
                    </div>
                    <span className="text-slate-500 text-[11px]">{profile.description}</span>
                    <span className="text-slate-400 text-[10px] font-mono">{profile.email}</span>
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
