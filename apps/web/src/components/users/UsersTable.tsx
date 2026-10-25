import React from 'react';
import { UserDto, RoleName, UserStatus } from '@sgaob/shared';
import { Shield, UserCheck, Users, CheckCircle2, AlertTriangle, Settings, RefreshCw, Phone, Mail } from 'lucide-react';
import { LoadingSpinner } from '../common/LoadingSpinner';

interface UsersTableProps {
  users: UserDto[];
  isLoading: boolean;
  onAssignRoles: (user: UserDto) => void;
  onChangeStatus: (user: UserDto) => void;
}

export const UsersTable: React.FC<UsersTableProps> = ({
  users,
  isLoading,
  onAssignRoles,
  onChangeStatus,
}) => {
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-12 transition-colors duration-200">
        <LoadingSpinner message="Cargando nómina de usuarios..." size="lg" />
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center transition-colors duration-200">
        <Users className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">No se encontraron usuarios</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
          No hay usuarios registrados que coincidan con los filtros seleccionados. Intenta modificar los parámetros de búsqueda.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors duration-200">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-left text-xs font-sans">
          <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider text-caption border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th scope="col" className="px-6 py-3.5">
                Usuario / Contacto
              </th>
              <th scope="col" className="px-6 py-3.5">
                Acreditaciones Técnicas
              </th>
              <th scope="col" className="px-6 py-3.5">
                Estado
              </th>
              <th scope="col" className="px-6 py-3.5">
                Consentimiento de Privacidad
              </th>
              <th scope="col" className="px-6 py-3.5 text-right">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-slate-900">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                {/* Nombre y Contacto */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-slate-800 text-blue-700 dark:text-blue-300 border dark:border-blue-900/40 flex items-center justify-center font-bold text-xs">
                      {user.firstName[0]}
                      {user.lastName[0]}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white text-sm">
                        {user.firstName} {user.lastName}
                      </div>
                      <div className="flex items-center space-x-2 text-slate-500 dark:text-slate-400 text-caption mt-0.5">
                        <span className="flex items-center">
                          <Mail className="w-3 h-3 mr-1 text-slate-400" />
                          {user.email}
                        </span>
                        {user.phone && (
                          <span className="flex items-center font-mono">
                            <Phone className="w-3 h-3 mr-1 text-slate-400" />
                            {user.phone}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </td>

                {/* Roles Técnicos Independientes (Anexo A.1) */}
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1.5 max-w-xs">
                    {user.roles && user.roles.length > 0 ? (
                      user.roles.map((role) => (
                        <span
                          key={role}
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-2xs font-bold border ${
                            role === RoleName.ARBITRO
                              ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-slate-800 dark:text-blue-300 dark:border-blue-900/40'
                              : role === RoleName.OFICIAL_MESA
                              ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-slate-800 dark:text-amber-300 dark:border-amber-900/40'
                              : 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-slate-800 dark:text-purple-300 dark:border-purple-900/40'
                          }`}
                        >
                          {role === RoleName.ARBITRO && <UserCheck className="w-3 h-3 mr-1" />}
                          {role === RoleName.OFICIAL_MESA && <Users className="w-3 h-3 mr-1" />}
                          {role === RoleName.ADMIN_COMISION_TECNICA && <Shield className="w-3 h-3 mr-1" />}
                          {role === RoleName.ARBITRO
                            ? 'Árbitro'
                            : role === RoleName.OFICIAL_MESA
                            ? 'Oficial Mesa'
                            : 'Comisión Técnica'}
                        </span>
                      ))
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-2xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                        Sin roles
                      </span>
                    )}
                  </div>
                </td>

                {/* Estado */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-2xs font-bold uppercase tracking-wider ${
                      user.status === UserStatus.ACTIVE
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-slate-800 dark:text-emerald-300 dark:border-emerald-900/40'
                        : user.status === UserStatus.INACTIVE
                        ? 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-slate-800 dark:text-rose-300 dark:border-rose-900/40'
                        : 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-slate-800 dark:text-amber-300 dark:border-amber-900/40'
                    }`}
                  >
                    {user.status === UserStatus.ACTIVE
                      ? 'Activo'
                      : user.status === UserStatus.INACTIVE
                      ? 'Inactivo'
                      : 'Pendiente Rol'}
                  </span>
                </td>

                {/* Consentimiento */}
                <td className="px-6 py-4 whitespace-nowrap">
                  {user.dataConsent ? (
                    <span className="inline-flex items-center text-emerald-700 dark:text-emerald-400 text-caption font-semibold">
                      <CheckCircle2 className="w-4 h-4 mr-1 text-emerald-500" />
                      Aceptado
                    </span>
                  ) : (
                    <span className="inline-flex items-center text-amber-700 dark:text-amber-400 text-caption font-semibold">
                      <AlertTriangle className="w-4 h-4 mr-1 text-amber-500" />
                      Pendiente
                    </span>
                  )}
                </td>

                {/* Acciones */}
                <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                  <button
                    onClick={() => onAssignRoles(user)}
                    className="inline-flex items-center px-2.5 py-1.5 rounded-lg border border-purple-200 dark:border-purple-900/40 bg-purple-50 dark:bg-slate-800 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-slate-700 font-semibold text-caption transition-colors focus:ring-2 focus:ring-purple-400 cursor-pointer"
                    title="Asignar o revocar roles técnicos"
                  >
                    <Settings className="w-3.5 h-3.5 mr-1" />
                    Editar Roles...
                  </button>

                  <button
                    onClick={() => onChangeStatus(user)}
                    className="inline-flex items-center px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 font-semibold text-caption transition-colors focus:ring-2 focus:ring-slate-400 cursor-pointer"
                    title="Modificar estado del usuario"
                  >
                    <RefreshCw className="w-3.5 h-3.5 mr-1" />
                    Cambiar Estado...
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UsersTable;
