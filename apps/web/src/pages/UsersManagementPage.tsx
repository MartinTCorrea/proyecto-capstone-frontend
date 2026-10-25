import React, { useState, useEffect, useCallback } from 'react';
import { UserDto, RoleName, UserStatus } from '@sgaob/shared';
import { usersApi } from '../api/users.api';
import { UsersTable } from '../components/users/UsersTable';
import { AssignRolesModal } from '../components/users/AssignRolesModal';
import { CreateUserModal } from '../components/users/CreateUserModal';
import { StatusChangeModal } from '../components/users/StatusChangeModal';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';

export const UsersManagementPage: React.FC = () => {
  const [users, setUsers] = useState<UserDto[]>([]);
  const [meta, setMeta] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<RoleName | ''>('');
  const [selectedStatus, setSelectedStatus] = useState<UserStatus | ''>('');

  // Modales
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedUserForRoles, setSelectedUserForRoles] = useState<UserDto | null>(null);
  const [selectedUserForStatus, setSelectedUserForStatus] = useState<UserDto | null>(null);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await usersApi.getUsers({
        page: meta.page,
        limit: meta.limit,
        role: selectedRole || undefined,
        status: selectedStatus || undefined,
        search: searchTerm.trim() || undefined,
      });

      setUsers(response.data);
      setMeta(response.meta);
    } catch (error) {
      console.error('Error cargando usuarios:', error);
    } finally {
      setIsLoading(false);
    }
  }, [meta.page, meta.limit, selectedRole, selectedStatus, searchTerm]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Manejo de búsqueda con reseteo de página a 1
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setMeta((prev) => ({ ...prev, page: 1 }));
  };

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedRole(e.target.value as RoleName | '');
    setMeta((prev) => ({ ...prev, page: 1 }));
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedStatus(e.target.value as UserStatus | '');
    setMeta((prev) => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= meta.totalPages) {
      setMeta((prev) => ({ ...prev, page: newPage }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Encabezado de la Página */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors duration-200">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-slate-800 border dark:border-purple-900/40 flex items-center justify-center text-purple-700 dark:text-purple-400 shadow-inner">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Gestión de Usuarios y Roles
              </h1>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Administración de padrón de árbitros, oficiales de mesa y personal técnico.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => fetchUsers()}
            title="Recargar listado de usuarios"
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-sm transition-all focus:ring-2 focus:ring-purple-500 cursor-pointer"
          >
            <UserPlus className="w-4 h-4 mr-1.5" />
            <span>Registrar Nuevo Usuario...</span>
          </button>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between transition-colors duration-200">
        {/* Input de Búsqueda */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nombre, apellido o correo electrónico..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-brand-500 focus:outline-none"
          />
        </div>

        {/* Filtros Dropdown */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center space-x-1.5 text-xs text-slate-500 dark:text-slate-400">
            <Filter className="w-3.5 h-3.5" />
            <span>Filtros:</span>
          </div>

          {/* Filtro por Rol */}
          <select
            value={selectedRole}
            onChange={handleRoleChange}
            className="text-xs border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-brand-500 focus:outline-none"
          >
            <option value="">Todos los Roles</option>
            <option value={RoleName.ARBITRO}>Árbitros</option>
            <option value={RoleName.OFICIAL_MESA}>Oficiales de Mesa</option>
            <option value={RoleName.ADMIN_COMISION_TECNICA}>Comisión Técnica</option>
          </select>

          {/* Filtro por Estado */}
          <select
            value={selectedStatus}
            onChange={handleStatusChange}
            className="text-xs border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-brand-500 focus:outline-none"
          >
            <option value="">Todos los Estados</option>
            <option value={UserStatus.ACTIVE}>Activos</option>
            <option value={UserStatus.INACTIVE}>Inactivos (Suspendidos)</option>
            <option value={UserStatus.PENDING_ROLE}>Pendientes de Rol</option>
          </select>
        </div>
      </div>

      {/* Tabla de Usuarios */}
      <UsersTable
        users={users}
        isLoading={isLoading}
        onAssignRoles={(user) => setSelectedUserForRoles(user)}
        onChangeStatus={(user) => setSelectedUserForStatus(user)}
      />

      {/* Barra de Paginación */}
      {!isLoading && users.length > 0 && (
        <div className="bg-white dark:bg-slate-900 px-6 py-3.5 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-slate-600 dark:text-slate-400 transition-colors duration-200">
          <div>
            <span>Mostrando página </span>
            <span className="font-bold text-slate-900 dark:text-white">{meta.page}</span>
            <span> de </span>
            <span className="font-bold text-slate-900 dark:text-white">{meta.totalPages}</span>
            <span> (Total: </span>
            <span className="font-bold text-slate-900 dark:text-white">{meta.total}</span>
            <span> usuarios registrados)</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => handlePageChange(meta.page - 1)}
              disabled={meta.page <= 1}
              className="inline-flex items-center px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed font-medium transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              <span>Anterior</span>
            </button>

            <span className="px-2 font-mono font-bold text-slate-700 dark:text-slate-300">
              {meta.page} / {meta.totalPages}
            </span>

            <button
              onClick={() => handlePageChange(meta.page + 1)}
              disabled={meta.page >= meta.totalPages}
              className="inline-flex items-center px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed font-medium transition-colors cursor-pointer"
            >
              <span>Siguiente</span>
              <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        </div>
      )}

      {/* Modales de Gestión de Usuario */}
      <CreateUserModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => fetchUsers()}
      />

      {selectedUserForRoles && (
        <AssignRolesModal
          isOpen={!!selectedUserForRoles}
          onClose={() => setSelectedUserForRoles(null)}
          user={selectedUserForRoles}
          onSuccess={() => fetchUsers()}
        />
      )}

      {selectedUserForStatus && (
        <StatusChangeModal
          isOpen={!!selectedUserForStatus}
          onClose={() => setSelectedUserForStatus(null)}
          user={selectedUserForStatus}
          onSuccess={() => fetchUsers()}
        />
      )}
    </div>
  );
};

export default UsersManagementPage;
