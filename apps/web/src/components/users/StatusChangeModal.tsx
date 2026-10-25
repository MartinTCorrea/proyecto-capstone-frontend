import React, { useState } from 'react';
import { UserDto, UserStatus } from '@sgaob/shared';
import { usersApi } from '../../api/users.api';
import { X, AlertTriangle, AlertCircle, Loader2 } from 'lucide-react';

interface StatusChangeModalProps {
  user: UserDto;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedUser: UserDto) => void;
}

export const StatusChangeModal: React.FC<StatusChangeModalProps> = ({
  user,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [selectedStatus, setSelectedStatus] = useState<UserStatus>(user.status);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const updated = await usersApi.updateStatus(user.id, selectedStatus);
      onSuccess(updated);
      onClose();
    } catch (err: any) {
      setErrorMsg(
        err.response?.data?.message || 'Error al actualizar el estado del usuario.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="status-modal-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 dark:bg-slate-950 text-white border-b dark:border-slate-800">
          <div className="flex items-center space-x-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <h2 id="status-modal-title" className="text-base font-bold">
              Modificar Estado de Cuenta
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white rounded-lg p-1 transition-colors cursor-pointer"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 p-3.5 rounded-xl">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Usuario
            </p>
            <p className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-mono">{user.email}</p>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-lg flex items-center space-x-2 text-rose-700 dark:text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Nuevo Estado
            </label>
            <div className="space-y-2">
              <label
                className={`flex items-start space-x-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  selectedStatus === UserStatus.ACTIVE
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 dark:border-emerald-600'
                    : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <input
                  type="radio"
                  name="status"
                  value={UserStatus.ACTIVE}
                  checked={selectedStatus === UserStatus.ACTIVE}
                  onChange={() => setSelectedStatus(UserStatus.ACTIVE)}
                  className="mt-1 text-emerald-600 focus:ring-emerald-500 border-slate-300 dark:border-slate-700"
                />
                <div className="text-xs">
                  <span className="font-bold text-emerald-900 dark:text-emerald-300">Activo</span>
                  <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                    El usuario puede ingresar, declarar disponibilidad y recibir nominaciones arbitrales.
                  </p>
                </div>
              </label>

              <label
                className={`flex items-start space-x-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  selectedStatus === UserStatus.INACTIVE
                    ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-400 dark:border-rose-600'
                    : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <input
                  type="radio"
                  name="status"
                  value={UserStatus.INACTIVE}
                  checked={selectedStatus === UserStatus.INACTIVE}
                  onChange={() => setSelectedStatus(UserStatus.INACTIVE)}
                  className="mt-1 text-rose-600 focus:ring-rose-500 border-slate-300 dark:border-slate-700"
                />
                <div className="text-xs">
                  <span className="font-bold text-rose-900 dark:text-rose-300">Inactivo</span>
                  <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                    Suspende al usuario: no podrá ser nominado a partidos ni participar en la programación.
                  </p>
                </div>
              </label>

              <label
                className={`flex items-start space-x-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  selectedStatus === UserStatus.PENDING_ROLE
                    ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-400 dark:border-amber-600'
                    : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <input
                  type="radio"
                  name="status"
                  value={UserStatus.PENDING_ROLE}
                  checked={selectedStatus === UserStatus.PENDING_ROLE}
                  onChange={() => setSelectedStatus(UserStatus.PENDING_ROLE)}
                  className="mt-1 text-amber-600 focus:ring-amber-500 border-slate-300 dark:border-slate-700"
                />
                <div className="text-xs">
                  <span className="font-bold text-amber-900 dark:text-amber-300">Pendiente de Rol</span>
                  <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                    Usuario registrado pero a la espera de validación de credenciales técnicas.
                  </p>
                </div>
              </label>
            </div>
          </div>

          <div className="pt-3 flex justify-end space-x-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-bold text-white bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 rounded-lg shadow-sm transition-colors flex items-center space-x-1.5 focus:ring-2 focus:ring-slate-500 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <span>Actualizar Estado</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StatusChangeModal;