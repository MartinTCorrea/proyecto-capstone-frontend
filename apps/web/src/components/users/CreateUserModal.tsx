import React, { useState } from 'react';
import { UserDto, RoleName } from '@sgaob/shared';
import { usersApi } from '../../api/users.api';
import { X, UserPlus, AlertCircle, Loader2 } from 'lucide-react';

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newUser: UserDto) => void;
}

export const CreateUserModal: React.FC<CreateUserModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [roles, setRoles] = useState<RoleName[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const toggleRole = (role: RoleName) => {
    setRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const newUser = await usersApi.createUser({
        email: email.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim() || undefined,
        roles: roles.length > 0 ? roles : undefined,
      });

      onSuccess(newUser);
      onClose();
    } catch (err: any) {
      setErrorMsg(
        err.response?.data?.message || 'Error al registrar el nuevo usuario.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-user-modal-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center space-x-2.5">
            <UserPlus className="w-5 h-5 text-blue-400" />
            <h2 id="create-user-modal-title" className="text-base font-bold">
              Pre-registrar Usuario (RF03, CU-02)
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white rounded-lg p-1 transition-colors focus:ring-2 focus:ring-blue-400"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center space-x-2 text-rose-700 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Correo Electrónico *
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ejemplo@sgaob.cl"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Nombre *
              </label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Carlos"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Apellido *
              </label>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Pérez"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Teléfono (opcional)
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+56912345678"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
            />
          </div>

          {/* Roles iniciales */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Roles Iniciales (Opcional)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <label className="flex items-center space-x-2 p-2 rounded-lg border border-slate-200 text-xs cursor-pointer hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={roles.includes(RoleName.ARBITRO)}
                  onChange={() => toggleRole(RoleName.ARBITRO)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span className="font-semibold text-slate-800">Árbitro</span>
              </label>

              <label className="flex items-center space-x-2 p-2 rounded-lg border border-slate-200 text-xs cursor-pointer hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={roles.includes(RoleName.OFICIAL_MESA)}
                  onChange={() => toggleRole(RoleName.OFICIAL_MESA)}
                  className="rounded text-amber-600 focus:ring-amber-500"
                />
                <span className="font-semibold text-slate-800">Oficial Mesa</span>
              </label>

              <label className="flex items-center space-x-2 p-2 rounded-lg border border-slate-200 text-xs cursor-pointer hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={roles.includes(RoleName.ADMIN_COMISION_TECNICA)}
                  onChange={() => toggleRole(RoleName.ADMIN_COMISION_TECNICA)}
                  className="rounded text-purple-600 focus:ring-purple-500"
                />
                <span className="font-semibold text-slate-800">Comisión</span>
              </label>
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5">
              Si no se seleccionan roles, el usuario quedará en estado <code>PENDING_ROLE</code> hasta su acreditación.
            </p>
          </div>

          <div className="pt-3 flex justify-end space-x-3 border-t border-slate-100">
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
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors flex items-center space-x-1.5 focus:ring-2 focus:ring-blue-500"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Creando usuario...</span>
                </>
              ) : (
                <span>Crear Perfil</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateUserModal;
