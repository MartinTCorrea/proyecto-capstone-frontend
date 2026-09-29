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
      <div className="bg-white rounded-xl border border-slate-200 p-12">
        <LoadingSpinner message="Cargando nómina de usuarios..." size="lg" />
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
        <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-800">No se encontraron usuarios</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          No hay usuarios registrados que coincidan con los filtros seleccionados. Intenta modificar los parámetros de búsqueda.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-left text-xs font-sans">
          <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
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
          <tbody className="divide-y divide-slate-100 bg-white">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-slate-50/80 transition-colors">
                {/* Nombre y Contacto */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                      {user.firstName[0]}
                      {user.lastName[0]}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-sm">
                        {user.firstName} {user.lastName}
                      </div>
                      <div className="flex items-center space-x-2 text-slate-500 text-[11px] mt-0.5">
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
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            role === RoleName.ARBITRO
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : role === RoleName.OFICIAL_MESA
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-purple-50 text-purple-700 border-purple-200'
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
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                        Sin roles
                      </span>
                    )}
                  </div>
                </td>

                {/* Estado */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      user.status === UserStatus.ACTIVE
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : user.status === UserStatus.INACTIVE
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
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
                    <span className="inline-flex items-center text-emerald-700 text-[11px] font-semibold">
                      <CheckCircle2 className="w-4 h-4 mr-1 text-emerald-500" />
                      Aceptado
                    </span>
                  ) : (
                    <span className="inline-flex items-center text-amber-700 text-[11px] font-semibold">
                      <AlertTriangle className="w-4 h-4 mr-1 text-amber-500" />
                      Pendiente
                    </span>
                  )}
                </td>

                {/* Acciones */}
                <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                  <button
                    onClick={() => onAssignRoles(user)}
                    className="inline-flex items-center px-2.5 py-1.5 rounded-lg border border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 font-semibold text-[11px] transition-colors focus:ring-2 focus:ring-purple-400"
                    title="Asignar o revocar roles técnicos"
                  >
                    <Settings className="w-3.5 h-3.5 mr-1" />
                    Roles
                  </button>

                  <button
                    onClick={() => onChangeStatus(user)}
                    className="inline-flex items-center px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 font-semibold text-[11px] transition-colors focus:ring-2 focus:ring-slate-400"
                    title="Modificar estado del usuario"
                  >
                    <RefreshCw className="w-3.5 h-3.5 mr-1" />
                    Estado
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
