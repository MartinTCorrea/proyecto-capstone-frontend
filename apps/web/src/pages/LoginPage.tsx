import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { RoleName } from '@sgaob/shared';
import { useAuth } from '../hooks/useAuth';
import { authApi } from '../api/auth.api';
import {
  Shield,
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  Sparkles,
  Loader2,
  CheckCircle2,
  KeyRound,
  UserCheck,
  X,
} from 'lucide-react';
import { BasketballLogo } from '../components/common/BasketballLogo';
import { ThemeToggle } from '../components/common/ThemeToggle';

export const LoginPage: React.FC = () => {
  const { loginWithDevToken, loginWithCognito, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Modo de login: 'cognito' (Autenticación oficial predeterminada) | 'dev' (Modo Test / Demo)
  const [authMode, setAuthMode] = useState<'cognito' | 'dev'>('cognito');

  // Estados de formularios y carga
  const [loadingRole, setLoadingRole] = useState<string | null>(null);
  const [cognitoEmail, setCognitoEmail] = useState('');
  const [cognitoPassword, setCognitoPassword] = useState('');
  const [isSubmittingCognito, setIsSubmittingCognito] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Estados del flujo de recuperación de contraseña
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState<'request' | 'confirm' | 'success'>('request');
  const [forgotEmail, setForgotEmail] = useState('');
  const [confirmationCode, setConfirmationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isSubmittingForgot, setIsSubmittingForgot] = useState(false);
  const [forgotMsg, setForgotMsg] = useState<string | null>(null);
  const [forgotError, setForgotError] = useState<string | null>(null);

  // Estados del flujo de confirmación de cuenta con código (SignUp)
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState('');
  const [confirmCode, setConfirmCode] = useState('');
  const [isSubmittingConfirm, setIsSubmittingConfirm] = useState(false);
  const [isResendingConfirmCode, setIsResendingConfirmCode] = useState(false);
  const [confirmMsg, setConfirmMsg] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [confirmSuccess, setConfirmSuccess] = useState(false);

  // Redirigir si ya está autenticado
  useEffect(() => {
    if (isAuthenticated) {
      const from = (location.state as any)?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  // Manejo de inicio de sesión dev / evaluación rápida
  const handleDevLogin = async (
    role: RoleName | 'DOUBLE_ROLE' | 'NONE',
    email: string,
    firstName: string,
    lastName: string,
  ) => {
    try {
      setLoadingRole(email);
      setErrorMsg(null);

      let roles: RoleName[] = [];
      if (role === 'DOUBLE_ROLE') {
        roles = [RoleName.ARBITRO, RoleName.OFICIAL_MESA];
      } else if (role !== 'NONE') {
        roles = [role];
      }

      await loginWithDevToken({
        email,
        firstName,
        lastName,
        roles,
      });

      const from = (location.state as any)?.from?.pathname || '/';
      navigate(from, { replace: true });
    } catch (err: any) {
      setErrorMsg(
        err.response?.data?.message ||
          'No fue posible conectar con el servicio. Por favor, reintenta en unos instantes.',
      );
    } finally {
      setLoadingRole(null);
    }
  };

  // Manejo de inicio de sesión directo con AWS Cognito
  const handleCognitoLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cognitoEmail || !cognitoPassword) {
      setErrorMsg('Por favor ingresa tanto el correo electrónico como la contraseña');
      return;
    }

    try {
      setIsSubmittingCognito(true);
      setErrorMsg(null);

      await loginWithCognito({
        email: cognitoEmail,
        password: cognitoPassword,
      });

      const from = (location.state as any)?.from?.pathname || '/';
      navigate(from, { replace: true });
    } catch (err: any) {
      setErrorMsg(
        err.response?.data?.message ||
          'Credenciales incorrectas. Revisa tu correo electrónico y contraseña.',
      );
    } finally {
      setIsSubmittingCognito(false);
    }
  };

  // Paso 1 de recuperación: solicitar código
  const handleRequestRecoveryCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) {
      setForgotError('Por favor ingresa tu correo electrónico.');
      return;
    }

    try {
      setIsSubmittingForgot(true);
      setForgotError(null);
      setForgotMsg(null);

      const res = await authApi.forgotPassword({ email: forgotEmail.trim() });
      setForgotMsg(res.message);
      setForgotStep('confirm');
    } catch (err: any) {
      setForgotError(
        err.response?.data?.message || 'Error al solicitar el código de recuperación.',
      );
    } finally {
      setIsSubmittingForgot(false);
    }
  };

  // Paso 2 de recuperación: confirmar nueva contraseña
  const handleConfirmNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);

    if (!confirmationCode || !newPassword || !confirmNewPassword) {
      setForgotError('Por favor completa todos los campos.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setForgotError('Las contraseñas no coinciden.');
      return;
    }

    if (newPassword.length < 8) {
      setForgotError('La nueva contraseña debe tener al menos 8 caracteres.');
      return;
    }

    try {
      setIsSubmittingForgot(true);
      const res = await authApi.confirmForgotPassword({
        email: forgotEmail.trim(),
        confirmationCode: confirmationCode.trim(),
        newPassword,
      });

      setForgotMsg(res.message);
      setForgotStep('success');
      setCognitoEmail(forgotEmail.trim());
      setCognitoPassword(newPassword);
    } catch (err: any) {
      setForgotError(
        err.response?.data?.message || 'Error al restablecer la contraseña.',
      );
    } finally {
      setIsSubmittingForgot(false);
    }
  };

  // Manejo de confirmación de cuenta con código de 6 dígitos
  const handleConfirmAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setConfirmError(null);
    setConfirmMsg(null);

    if (!confirmEmail || !confirmCode) {
      setConfirmError('Por favor ingresa tanto el correo como el código de 6 dígitos.');
      return;
    }

    try {
      setIsSubmittingConfirm(true);
      const res = await authApi.confirmSignUp({
        email: confirmEmail.trim(),
        confirmationCode: confirmCode.trim(),
      });

      setConfirmMsg(res.message);
      setConfirmSuccess(true);
      setCognitoEmail(confirmEmail.trim());
      setErrorMsg(null);
    } catch (err: any) {
      setConfirmError(
        err.response?.data?.message || 'Error al confirmar la cuenta. Verifica el código ingresado.',
      );
    } finally {
      setIsSubmittingConfirm(false);
    }
  };

  // Reenviar código de confirmación de registro
  const handleResendConfirmationCode = async () => {
    if (!confirmEmail) {
      setConfirmError('Por favor ingresa tu correo electrónico para solicitar un nuevo código.');
      return;
    }

    try {
      setIsResendingConfirmCode(true);
      setConfirmError(null);
      setConfirmMsg(null);
      const res = await authApi.resendConfirmationCode({ email: confirmEmail.trim() });
      setConfirmMsg(res.message);
    } catch (err: any) {
      setConfirmError(
        err.response?.data?.message || 'No fue posible reenviar el código. Intenta nuevamente.',
      );
    } finally {
      setIsResendingConfirmCode(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative transition-colors duration-200">
      {/* Switch de Modo Oscuro en la esquina superior del Login */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
        <ThemeToggle />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="mx-auto w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg mb-4">
          <BasketballLogo className="w-9 h-9" />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          SGAOB
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Sistema de Gestión de Árbitros y Oficiales de Básquetbol
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-white dark:bg-slate-900 py-8 px-6 shadow-xl border border-slate-200 dark:border-slate-800 sm:rounded-xl sm:px-10 space-y-6 transition-colors duration-200">
          {errorMsg && (
            <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-lg flex flex-col space-y-2 text-rose-700 dark:text-rose-300 text-sm">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
                <span>{errorMsg}</span>
              </div>
              {errorMsg.toLowerCase().includes('no ha sido confirmada') && (
                <div className="pl-8 pt-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setConfirmEmail(cognitoEmail || '');
                      setConfirmCode('');
                      setConfirmError(null);
                      setConfirmMsg(null);
                      setConfirmSuccess(false);
                      setIsConfirmModalOpen(true);
                    }}
                    className="inline-flex items-center space-x-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline cursor-pointer transition-colors"
                  >
                    <span>¿Recibiste un código de 6 dígitos en tu correo? Activar cuenta aquí</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Selector de modo de autenticación (Inicio de Sesión oficial vs Modo Test) */}
          <div className="flex p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => {
                setAuthMode('cognito');
                setErrorMsg(null);
              }}
              className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                authMode === 'cognito'
                  ? 'bg-white dark:bg-slate-900 shadow-sm text-blue-700 dark:text-blue-400 border border-slate-200 dark:border-slate-700'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Lock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Iniciar Sesión</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('dev');
                setErrorMsg(null);
              }}
              className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                authMode === 'dev'
                  ? 'bg-white dark:bg-slate-900 shadow-sm text-blue-700 dark:text-blue-400 border border-slate-200 dark:border-slate-700'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Modo Test / Demo</span>
            </button>
          </div>

          {/* VISTA 1: Modo Acceso Rápido / Demo */}
          {authMode === 'dev' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
                  <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <span>Acceso Rápido / Demostración de Roles</span>
                </h2>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Selecciona un perfil operativo para ingresar y explorar la plataforma:
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Perfil 1: Admin Comisión Técnica */}
                <button
                  onClick={() =>
                    handleDevLogin(
                      RoleName.ADMIN_COMISION_TECNICA,
                      'admin.comision@sgaob.cl',
                      'Martín',
                      'Correa',
                    )
                  }
                  disabled={!!loadingRole}
                  className="p-4 rounded-lg border border-purple-200 dark:border-purple-900/40 bg-purple-50/50 dark:bg-slate-800/70 hover:bg-purple-100/60 dark:hover:bg-slate-800 hover:border-purple-300 dark:hover:border-purple-700 text-left transition-all flex flex-col justify-between group focus:ring-2 focus:ring-purple-500 cursor-pointer"
                >
                  <div>
                    <span className="text-2xs uppercase font-bold tracking-wider text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-slate-800 px-2 py-0.5 rounded-full inline-block mb-1.5 border dark:border-purple-800/40">
                      Comisión Técnica
                    </span>
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm group-hover:text-purple-900 dark:group-hover:text-purple-300">
                      Administrador
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                      Gestión total de árbitros, nominaciones y torneos.
                    </p>
                  </div>
                  <div className="mt-3 flex items-center text-xs font-semibold text-purple-700 dark:text-purple-400 group-hover:translate-x-1 transition-transform">
                    <span>
                      {loadingRole === 'admin.comision@sgaob.cl' ? 'Ingresando...' : 'Ingresar perfil'}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </div>
                </button>

                {/* Perfil 2: Árbitro de Campo */}
                <button
                  onClick={() =>
                    handleDevLogin(
                      RoleName.ARBITRO,
                      'carlos.arbitro@sgaob.cl',
                      'Carlos',
                      'Pérez',
                    )
                  }
                  disabled={!!loadingRole}
                  className="p-4 rounded-lg border border-blue-200 dark:border-blue-900/40 bg-blue-50/50 dark:bg-slate-800/70 hover:bg-blue-100/60 dark:hover:bg-slate-800 hover:border-blue-300 dark:hover:border-blue-700 text-left transition-all flex flex-col justify-between group focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <div>
                    <span className="text-2xs uppercase font-bold tracking-wider text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-slate-800 px-2 py-0.5 rounded-full inline-block mb-1.5 border dark:border-blue-800/40">
                      Árbitro de Campo
                    </span>
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm group-hover:text-blue-900 dark:group-hover:text-blue-300">
                      Carlos Pérez
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                      Declaración de disponibilidad y aceptación de designaciones.
                    </p>
                  </div>
                  <div className="mt-3 flex items-center text-xs font-semibold text-blue-700 dark:text-blue-400 group-hover:translate-x-1 transition-transform">
                    <span>
                      {loadingRole === 'carlos.arbitro@sgaob.cl' ? 'Ingresando...' : 'Ingresar perfil'}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </div>
                </button>

                {/* Perfil 3: Oficial de Mesa */}
                <button
                  onClick={() =>
                    handleDevLogin(
                      RoleName.OFICIAL_MESA,
                      'ana.oficial@sgaob.cl',
                      'Ana',
                      'Gómez',
                    )
                  }
                  disabled={!!loadingRole}
                  className="p-4 rounded-lg border border-amber-200 dark:border-amber-900/40 bg-amber-50/50 dark:bg-slate-800/70 hover:bg-amber-100/60 dark:hover:bg-slate-800 hover:border-amber-300 dark:hover:border-amber-700 text-left transition-all flex flex-col justify-between group focus:ring-2 focus:ring-amber-500 cursor-pointer"
                >
                  <div>
                    <span className="text-2xs uppercase font-bold tracking-wider text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-slate-800 px-2 py-0.5 rounded-full inline-block mb-1.5 border dark:border-amber-800/40">
                      Oficial de Mesa
                    </span>
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm group-hover:text-amber-900 dark:group-hover:text-amber-300">
                      Ana Gómez
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                      Planillero, cronometrador y operador de 24 segundos.
                    </p>
                  </div>
                  <div className="mt-3 flex items-center text-xs font-semibold text-amber-700 dark:text-amber-400 group-hover:translate-x-1 transition-transform">
                    <span>
                      {loadingRole === 'ana.oficial@sgaob.cl' ? 'Ingresando...' : 'Ingresar perfil'}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </div>
                </button>

                {/* Perfil 4: Doble Rol */}
                <button
                  onClick={() =>
                    handleDevLogin(
                      'DOUBLE_ROLE',
                      'mario.doble@sgaob.cl',
                      'Mario',
                      'Silva',
                    )
                  }
                  disabled={!!loadingRole}
                  className="p-4 rounded-lg border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/50 dark:bg-slate-800/70 hover:bg-emerald-100/60 dark:hover:bg-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700 text-left transition-all flex flex-col justify-between group focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                >
                  <div>
                    <span className="text-2xs uppercase font-bold tracking-wider text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-slate-800 px-2 py-0.5 rounded-full inline-block mb-1.5 border dark:border-emerald-800/40">
                      Doble Rol
                    </span>
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm group-hover:text-emerald-900 dark:group-hover:text-emerald-300">
                      Mario Silva
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                      Acreditación combinada de Árbitro y Oficial de Mesa.
                    </p>
                  </div>
                  <div className="mt-3 flex items-center text-xs font-semibold text-emerald-700 dark:text-emerald-400 group-hover:translate-x-1 transition-transform">
                    <span>
                      {loadingRole === 'mario.doble@sgaob.cl' ? 'Ingresando...' : 'Ingresar perfil'}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </div>
                </button>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 rounded-lg flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                <span className="font-medium">Sesión activa: Simulación de credencial autorizada</span>
                <span className="px-2 py-0.5 bg-emerald-100 dark:bg-slate-800 text-emerald-800 dark:text-emerald-300 border dark:border-emerald-800/40 rounded font-semibold text-2xs">
                  Modo Operativo Rápido
                </span>
              </div>
            </div>
          )}

          {/* VISTA 2: Modo Oficial (Inicio de Sesión) */}
          {authMode === 'cognito' && (
            <div className="space-y-5">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
                  <Lock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <span>Ingreso a la Plataforma</span>
                </h2>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Inicia sesión con tus credenciales de acceso para gestionar partidos y asignaciones.
                </p>
              </div>

              {/* Formulario de Login Directo */}
              <form onSubmit={handleCognitoLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Correo Electrónico
                  </label>
                  <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      value={cognitoEmail}
                      onChange={(e) => setCognitoEmail(e.target.value)}
                      placeholder="arbitro@sgaob.cl"
                      required
                      className="block w-full pl-9 pr-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Contraseña
                  </label>
                  <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type="password"
                      value={cognitoPassword}
                      onChange={(e) => setCognitoPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="block w-full pl-9 pr-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      setConfirmEmail(cognitoEmail || '');
                      setConfirmCode('');
                      setConfirmError(null);
                      setConfirmMsg(null);
                      setConfirmSuccess(false);
                      setIsConfirmModalOpen(true);
                    }}
                    className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                  >
                    ¿Confirmar cuenta con código?
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotPasswordOpen(true);
                      setForgotStep('request');
                      setForgotEmail(cognitoEmail || '');
                      setForgotMsg(null);
                      setForgotError(null);
                      setConfirmationCode('');
                      setNewPassword('');
                      setConfirmNewPassword('');
                    }}
                    className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors cursor-pointer"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingCognito}
                  className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg shadow transition-colors flex items-center justify-center space-x-2 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmittingCognito ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Iniciando sesión...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>Iniciar Sesión</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* MODAL DE RECUPERACIÓN DE CONTRASEÑA */}
      {isForgotPasswordOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full overflow-hidden transition-colors duration-200">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-900 dark:bg-slate-950 text-white border-b dark:border-slate-800">
              <div className="flex items-center space-x-2.5">
                <KeyRound className="w-5 h-5 text-blue-400" />
                <h2 className="text-base font-bold">Recuperación de Contraseña</h2>
              </div>
              <button
                onClick={() => setIsForgotPasswordOpen(false)}
                className="text-slate-400 hover:text-white rounded-lg p-1 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {forgotError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-lg flex items-center space-x-2 text-rose-700 dark:text-rose-300 text-xs">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{forgotError}</span>
                </div>
              )}

              {forgotMsg && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 rounded-lg flex items-center space-x-2 text-emerald-800 dark:text-emerald-300 text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                  <span>{forgotMsg}</span>
                </div>
              )}

              {/* PASO 1: Ingresar correo electrónico */}
              {forgotStep === 'request' && (
                <form onSubmit={handleRequestRecoveryCode} className="space-y-4">
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Ingresa el correo electrónico asociado a tu cuenta para recibir un código de confirmación de 6 dígitos.
                  </p>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Correo Electrónico
                    </label>
                    <div className="relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        type="email"
                        required
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="arbitro@sgaob.cl"
                        className="block w-full pl-9 pr-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsForgotPasswordOpen(false)}
                      className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingForgot}
                      className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {isSubmittingForgot ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Enviando código...</span>
                        </>
                      ) : (
                        <span>Enviar Código</span>
                      )}
                    </button>
                  </div>
                </form>
              )}

              {/* PASO 2: Confirmar código y nueva clave */}
              {forgotStep === 'confirm' && (
                <form onSubmit={handleConfirmNewPassword} className="space-y-4">
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Ingresa el código de 6 dígitos enviado a <strong>{forgotEmail}</strong> y define tu nueva contraseña.
                  </p>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Código de Confirmación (6 dígitos)
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={confirmationCode}
                      onChange={(e) => setConfirmationCode(e.target.value)}
                      placeholder="XXXXXX"
                      className="block w-full px-3 py-2 text-center tracking-widest font-mono text-base uppercase border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Nueva Contraseña (min. 8 caracteres)
                    </label>
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="block w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Confirmar Nueva Contraseña
                    </label>
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="block w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    <button
                      type="button"
                      onClick={() => setForgotStep('request')}
                      className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 underline cursor-pointer"
                    >
                      Volver a pedir código
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingForgot}
                      className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {isSubmittingForgot ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Restableciendo...</span>
                        </>
                      ) : (
                        <span>Restablecer Contraseña</span>
                      )}
                    </button>
                  </div>
                </form>
              )}

              {/* PASO 3: Éxito */}
              {forgotStep === 'success' && (
                <div className="text-center space-y-4 py-2">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Contraseña Restablecida Exitosamente
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Tu contraseña ha sido actualizada. Ya puedes iniciar sesión con tu cuenta.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsForgotPasswordOpen(false)}
                    className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer"
                  >
                    Volver al Inicio de Sesión
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMACIÓN DE CUENTA DE USUARIO */}
      {isConfirmModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full overflow-hidden transition-colors duration-200">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-900 dark:bg-slate-950 text-white border-b dark:border-slate-800">
              <div className="flex items-center space-x-2.5">
                <UserCheck className="w-5 h-5 text-blue-400" />
                <h2 className="text-base font-bold">Confirmación de Cuenta</h2>
              </div>
              <button
                onClick={() => setIsConfirmModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                aria-label="Cerrar modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {confirmSuccess ? (
                <div className="text-center space-y-4 py-2">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    ¡Cuenta Confirmada Exitosamente!
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Tu cuenta ha sido activada en la plataforma. Ya puedes iniciar sesión con tu correo y contraseña.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setIsConfirmModalOpen(false);
                      setAuthMode('cognito');
                    }}
                    className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer"
                  >
                    Ir al Inicio de Sesión
                  </button>
                </div>
              ) : (
                <form onSubmit={handleConfirmAccount} className="space-y-4">
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Ingresa el código de 6 dígitos que recibiste por correo electrónico para activar tu cuenta e ingresar a la plataforma.
                  </p>

                  {confirmError && (
                    <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-lg flex items-start space-x-2.5 text-rose-700 dark:text-rose-300 text-xs">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span>{confirmError}</span>
                    </div>
                  )}

                  {confirmMsg && (
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 rounded-lg flex items-start space-x-2.5 text-emerald-700 dark:text-emerald-300 text-xs">
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span>{confirmMsg}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Correo Electrónico
                    </label>
                    <div className="relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        type="email"
                        required
                        value={confirmEmail}
                        onChange={(e) => setConfirmEmail(e.target.value)}
                        placeholder="tu-correo@sgaob.cl"
                        className="block w-full pl-9 pr-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Código de Confirmación (6 dígitos)
                    </label>
                    <div className="relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <KeyRound className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        required
                        maxLength={6}
                        value={confirmCode}
                        onChange={(e) => setConfirmCode(e.target.value)}
                        placeholder="XXXXXX"
                        className="block w-full pl-9 pr-3 py-2 text-center tracking-widest font-mono text-base uppercase border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    <button
                      type="button"
                      disabled={isResendingConfirmCode}
                      onClick={handleResendConfirmationCode}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline cursor-pointer disabled:opacity-50"
                    >
                      {isResendingConfirmCode ? 'Reenviando...' : 'Reenviar código'}
                    </button>

                    <button
                      type="submit"
                      disabled={isSubmittingConfirm}
                      className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {isSubmittingConfirm ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Verificando...</span>
                        </>
                      ) : (
                        <span>Confirmar Cuenta</span>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginPage;
