import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { usersApi } from '../api/users.api';
import { authApi } from '../api/auth.api';
import { RoleName } from '@sgaob/shared';
import {
  User,
  Shield,
  KeyRound,
  Lock,
  Phone,
  Mail,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  Save,
  Check,
  FileCheck,
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, refreshProfile } = useAuth();

  // Estados de datos personales
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState<string | null>(null);
  const [profileErrorMsg, setProfileErrorMsg] = useState<string | null>(null);

  // Estados de cambio de contraseña
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordSuccessMsg, setPasswordSuccessMsg] = useState<string | null>(null);
  const [passwordErrorMsg, setPasswordErrorMsg] = useState<string | null>(null);

  // Estados de consentimiento
  const [isRecordingConsent, setIsRecordingConsent] = useState(false);
  const [consentSuccessMsg, setConsentSuccessMsg] = useState<string | null>(null);

  // Inicializar campos con datos del usuario actual
  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
      setPhone(user.phone || '');
    }
  }, [user]);

  // Manejo de actualización de perfil
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setIsSavingProfile(true);
      setProfileSuccessMsg(null);
      setProfileErrorMsg(null);

      await usersApi.updateUser(user.id, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim() || undefined,
      });

      await refreshProfile();
      setProfileSuccessMsg('Datos personales actualizados correctamente.');
    } catch (err: any) {
      setProfileErrorMsg(
        err.response?.data?.message || 'Error al actualizar tus datos personales.',
      );
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Manejo de cambio de contraseña
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSuccessMsg(null);
    setPasswordErrorMsg(null);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordErrorMsg('Por favor completa todos los campos de contraseña.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordErrorMsg('La nueva contraseña y su confirmación no coinciden.');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordErrorMsg('La nueva contraseña debe tener al menos 8 caracteres.');
      return;
    }

    try {
      setIsChangingPassword(true);
      const res = await authApi.changePassword({
        currentPassword,
        newPassword,
      });

      setPasswordSuccessMsg(res.message || 'Contraseña actualizada exitosamente.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordErrorMsg(
        err.response?.data?.message || 'Error al actualizar la contraseña.',
      );
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Manejo de consentimiento de datos
  const handleAcceptConsent = async () => {
    try {
      setIsRecordingConsent(true);
      await usersApi.recordConsent();
      await refreshProfile();
      setConsentSuccessMsg('Consentimiento de tratamiento de datos registrado exitosamente.');
    } catch (err: any) {
      console.error('Error al registrar consentimiento:', err);
    } finally {
      setIsRecordingConsent(false);
    }
  };

  const roleBadgeMap: Record<RoleName, { label: string; color: string }> = {
    [RoleName.ADMIN_COMISION_TECNICA]: {
      label: 'Comisión Técnica',
      color: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-slate-800 dark:text-purple-300 dark:border-purple-800/40',
    },
    [RoleName.ARBITRO]: {
      label: 'Árbitro',
      color: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-slate-800 dark:text-blue-300 dark:border-blue-800/40',
    },
    [RoleName.OFICIAL_MESA]: {
      label: 'Oficial de Mesa',
      color: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-slate-800 dark:text-amber-300 dark:border-amber-800/40',
    },
  };

  if (!user) {
    return (
      <div className="flex justify-center items-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const initials = `${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}`.toUpperCase();

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Cabecera del Perfil */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-5 transition-colors duration-200">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-brand-600 to-brand-800 text-white flex items-center justify-center text-2xl font-black shadow-md flex-shrink-0">
          {initials || <User className="w-10 h-10" />}
        </div>
        <div className="flex-1 text-center sm:text-left space-y-1">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-3">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              {user.firstName} {user.lastName}
            </h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-slate-800 text-emerald-800 dark:text-emerald-300 border dark:border-emerald-800/40">
              {user.status}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-mono flex items-center justify-center sm:justify-start space-x-1.5">
            <Mail className="w-3.5 h-3.5" />
            <span>{user.email}</span>
          </p>
          <div className="flex flex-wrap gap-1.5 pt-1.5 justify-center sm:justify-start">
            {user.roles && user.roles.length > 0 ? (
              user.roles.map((r) => {
                const badge = roleBadgeMap[r];
                return (
                  <span
                    key={r}
                    className={`text-2xs uppercase font-bold px-2 py-0.5 rounded-full border ${badge?.color}`}
                  >
                    {badge?.label || r}
                  </span>
                );
              })
            ) : (
              <span className="text-2xs text-slate-400 dark:text-slate-500">Sin roles asignados</span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* TARJETA 1: Información Personal */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 space-y-4 transition-colors duration-200">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">Información Personal</h2>
          </div>

          {profileSuccessMsg && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 rounded-lg flex items-center space-x-2 text-xs text-emerald-800 dark:text-emerald-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
              <span>{profileSuccessMsg}</span>
            </div>
          )}

          {profileErrorMsg && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-lg flex items-center space-x-2 text-xs text-rose-700 dark:text-rose-300">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{profileErrorMsg}</span>
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Correo Electrónico
              </label>
              <input
                type="email"
                disabled
                value={user.email}
                className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-mono cursor-not-allowed"
              />
              <span className="text-2xs text-slate-400 dark:text-slate-500 mt-0.5 block">
                Gestionado por el directorio de autenticación oficial.
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nombre(s) *
                </label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Apellido(s) *
                </label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Teléfono de Contacto
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Phone className="w-3.5 h-3.5" />
                </div>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+56912345678"
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSavingProfile}
                className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg shadow-sm transition-colors flex items-center justify-center space-x-1.5 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 cursor-pointer"
              >
                {isSavingProfile ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Guardando cambios...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Guardar Datos Personales</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* TARJETA 2: Seguridad y Cambio de Contraseña */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 space-y-4 transition-colors duration-200">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <KeyRound className="w-5 h-5 text-brand-600 dark:text-brand-400" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">Seguridad y Contraseña</h2>
          </div>

          {passwordSuccessMsg && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 rounded-lg flex items-center space-x-2 text-xs text-emerald-800 dark:text-emerald-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
              <span>{passwordSuccessMsg}</span>
            </div>
          )}

          {passwordErrorMsg && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-lg flex items-center space-x-2 text-xs text-rose-700 dark:text-rose-300">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{passwordErrorMsg}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Contraseña Actual *
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-3.5 h-3.5" />
                </div>
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-9 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  {showCurrentPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nueva Contraseña *
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-3.5 h-3.5" />
                </div>
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-9 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
              <span className="text-2xs text-slate-400 dark:text-slate-500 mt-0.5 block">
                Mínimo 8 caracteres (letras, números y símbolos).
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Confirmar Nueva Contraseña *
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-3.5 h-3.5" />
                </div>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isChangingPassword}
                className="w-full py-2 px-4 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs rounded-lg shadow-sm transition-colors flex items-center justify-center space-x-1.5 focus:ring-2 focus:ring-brand-500 disabled:opacity-50 cursor-pointer"
              >
                {isChangingPassword ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Actualizando contraseña...</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Actualizar Contraseña</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* TARJETA 3: Consentimiento de Tratamiento de Datos */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 space-y-3 transition-colors duration-200">
        <div className="flex items-center space-x-2 pb-2 border-b border-slate-100 dark:border-slate-800">
          <FileCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Consentimiento de Tratamiento de Datos (Ley N° 19.628)
          </h2>
        </div>

        {consentSuccessMsg && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 rounded-lg flex items-center space-x-2 text-xs text-emerald-800 dark:text-emerald-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            <span>{consentSuccessMsg}</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Estado del Consentimiento:</span>
              {user.dataConsent ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-caption font-bold bg-emerald-100 dark:bg-slate-800 text-emerald-800 dark:text-emerald-300 border dark:border-emerald-800/40">
                  <Check className="w-3 h-3 mr-1" />
                  Aceptado formalmente
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-caption font-bold bg-amber-100 dark:bg-slate-800 text-amber-800 dark:text-amber-300 border dark:border-amber-800/40">
                  Pendiente de aceptación
                </span>
              )}
            </div>
            <p className="text-caption text-slate-500 dark:text-slate-400 mt-1">
              {user.dataConsent && user.dataConsentDate
                ? `Registrado formalmente el ${new Date(user.dataConsentDate).toLocaleString('es-CL')}`
                : 'Conforme a la normativa, autorizas el uso de tus datos para gestión de partidos y designaciones.'}
            </p>
          </div>

          {!user.dataConsent && (
            <button
              onClick={handleAcceptConsent}
              disabled={isRecordingConsent}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg transition-colors flex items-center space-x-1.5 cursor-pointer disabled:opacity-50 flex-shrink-0"
            >
              {isRecordingConsent ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Registrando...</span>
                </>
              ) : (
                <>
                  <Shield className="w-3.5 h-3.5" />
                  <span>Aceptar Consentimiento</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
