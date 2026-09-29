import React, { useState } from 'react';
import { UserDto, RoleName } from '@sgaob/shared';
import { usersApi } from '../../api/users.api';
import { X, Shield, UserCheck, Users, Info, AlertCircle, Loader2 } from 'lucide-react';

interface AssignRolesModalProps {
  user: UserDto;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedUser: UserDto) => void;
}

export const AssignRolesModal: React.FC<AssignRolesModalProps> = ({
  user,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [selectedRoles, setSelectedRoles] = useState<RoleName[]>(user.roles || []);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const toggleRole = (role: RoleName) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const updated = await usersApi.assignRoles(user.id, selectedRoles);
      onSuccess(updated);
      onClose();
    } catch (err: any) {
      setErrorMsg(
        err.response?.data?.message || 'Error al actualizar los roles del usuario.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Cabecera del Modal */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center space-x-2.5">
            <Shield className="w-5 h-5 text-purple-400" />
            <h2 id="modal-title" className="text-base font-bold">
              Acreditaciones Técnicas
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white rounded-lg p-1 transition-colors focus:ring-2 focus:ring-purple-400 cursor-pointer"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Info del usuario */}
          <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Usuario Seleccionado
            </p>
            <p className="text-sm font-bold text-slate-900 mt-0.5">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-xs text-slate-600 font-mono">{user.email}</p>
          </div>

          {/* Banner explicativo */}
          <div className="bg-purple-50 border border-purple-200 p-3.5 rounded-xl flex items-start space-x-3 text-purple-900 text-xs leading-relaxed">
            <Info className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Acreditaciones independientes:</span>
              <p className="mt-0.5 text-purple-800">
                Las funciones de <strong>Árbitro</strong> y <strong>Oficial de Mesa</strong> son mutuamente independientes. Un usuario puede poseer una, la otra, o ambas simultáneamente para desempeñar ambas tareas en las competencias.
              </p>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center space-x-2 text-rose-700 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Opciones de Roles */}
          <fieldset className="space-y-3">
            <legend className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Acreditaciones Disponibles
            </legend>

            {/* Rol 1: ÁRBITRO */}
            <label
              className={`flex items-start space-x-3 p-3 rounded-xl border transition-all cursor-pointer ${
                selectedRoles.includes(RoleName.ARBITRO)
                  ? 'bg-blue-50 border-blue-400 shadow-sm'
                  : 'bg-white border-slate-200 hover:bg-slate-50'
              }`}
            >
              <input
                type="checkbox"
                checked={selectedRoles.includes(RoleName.ARBITRO)}
                onChange={() => toggleRole(RoleName.ARBITRO)}
                className="mt-1 w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
              />
              <div className="flex-1 text-xs">
                <div className="flex items-center space-x-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                  <span className="font-bold text-slate-900">Árbitro de Campo (ARBITRO)</span>
                </div>
                <p className="text-slate-500 mt-0.5">
                  Habilita al usuario para ser nominado como Árbitro Principal (crew chief) o Asistente en cancha.
                </p>
              </div>
            </label>

            {/* Rol 2: OFICIAL DE MESA */}
            <label
              className={`flex items-start space-x-3 p-3 rounded-xl border transition-all cursor-pointer ${
                selectedRoles.includes(RoleName.OFICIAL_MESA)
                  ? 'bg-amber-50 border-amber-400 shadow-sm'
                  : 'bg-white border-slate-200 hover:bg-slate-50'
              }`}
            >
              <input
                type="checkbox"
                checked={selectedRoles.includes(RoleName.OFICIAL_MESA)}
                onChange={() => toggleRole(RoleName.OFICIAL_MESA)}
                className="mt-1 w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-slate-300"
              />
              <div className="flex-1 text-xs">
                <div className="flex items-center space-x-1.5">
                  <Users className="w-3.5 h-3.5 text-amber-600" />
                  <span className="font-bold text-slate-900">Oficial de Mesa Técnica (OFICIAL_MESA)</span>
                </div>
                <p className="text-slate-500 mt-0.5">
                  Habilita funciones de cronometrador, operador de 24 segundos o planillero en mesa de control.
                </p>
              </div>
            </label>

            {/* Rol 3: ADMIN COMISIÓN TÉCNICA */}
            <label
              className={`flex items-start space-x-3 p-3 rounded-xl border transition-all cursor-pointer ${
                selectedRoles.includes(RoleName.ADMIN_COMISION_TECNICA)
                  ? 'bg-purple-50 border-purple-400 shadow-sm'
                  : 'bg-white border-slate-200 hover:bg-slate-50'
              }`}
            >
              <input
                type="checkbox"
                checked={selectedRoles.includes(RoleName.ADMIN_COMISION_TECNICA)}
                onChange={() => toggleRole(RoleName.ADMIN_COMISION_TECNICA)}
                className="mt-1 w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-slate-300"
              />
              <div className="flex-1 text-xs">
                <div className="flex items-center space-x-1.5">
                  <Shield className="w-3.5 h-3.5 text-purple-600" />
                  <span className="font-bold text-slate-900">Comisión Técnica (ADMIN_COMISION_TECNICA)</span>
                </div>
                <p className="text-slate-500 mt-0.5">
                  Acceso a gestión administrativa, nominaciones, configuración de parámetros y auditoría.
                </p>
              </div>
            </label>
          </fieldset>

          {/* Botones de Acción */}
          <div className="pt-2 flex justify-end space-x-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-sm transition-colors flex items-center space-x-1.5 focus:ring-2 focus:ring-purple-500"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <span>Guardar Roles</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AssignRolesModal;
