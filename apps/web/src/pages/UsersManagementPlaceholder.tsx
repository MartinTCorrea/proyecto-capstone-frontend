import React from 'react';
import { Users } from 'lucide-react';

export const UsersManagementPlaceholder: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 sm:p-8">
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center text-purple-700">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Gestión de Usuarios y Roles (RF02, RF03)
            </h1>
            <p className="text-sm text-slate-500">
              Vista protegida para Comisión Técnica (RBAC verificado con éxito).
            </p>
          </div>
        </div>

        <div className="mt-6 p-4 bg-purple-50 border border-purple-200 rounded-lg text-xs text-purple-800 leading-relaxed">
          <strong>Ruta Protegida por `RoleGuard([RoleName.ADMIN_COMISION_TECNICA])`:</strong>
          <br />
          Esta pantalla se implementará completamente en el <strong>PR6</strong>, donde se conectará la grilla interactiva paginada contra <code>GET /api/users</code> y el modal de asignación de roles independientes (Árbitro y Mesa) contra <code>PATCH /api/users/:id/roles</code>.
        </div>
      </div>
    </div>
  );
};

export default UsersManagementPlaceholder;
