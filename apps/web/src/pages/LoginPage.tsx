import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { RoleName } from '@sgaob/shared';
import { useAuth } from '../hooks/useAuth';
import { authApi, CognitoConfigResponse } from '../api/auth.api';
import {
  Shield,
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  Cloud,
  Sparkles,
  ExternalLink,
  Loader2,
  CheckCircle2,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { loginWithDevToken, loginWithCognito, loginWithToken, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Modo de login: 'dev' (Evaluación rápida 1-clic) | 'cognito' (AWS Cognito Cloud)
  const [authMode, setAuthMode] = useState<'dev' | 'cognito'>('dev');

  // Estados de formularios y carga
  const [loadingRole, setLoadingRole] = useState<string | null>(null);
  const [cognitoEmail, setCognitoEmail] = useState('');
  const [cognitoPassword, setCognitoPassword] = useState('');
  const [isSubmittingCognito, setIsSubmittingCognito] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [cognitoConfig, setCognitoConfig] = useState<CognitoConfigResponse | null>(null);

  // Redirigir si ya está autenticado
  useEffect(() => {
    if (isAuthenticated) {
      const from = (location.state as any)?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  // Consultar configuración pública de AWS Cognito
  useEffect(() => {
    authApi
      .getCognitoConfig()
      .then((cfg) => setCognitoConfig(cfg))
      .catch((err) => {
        console.warn('No se pudo obtener la configuración pública de Cognito:', err);
      });
  }, []);

  // Detectar redirección OIDC de Cognito Hosted UI vía URL hash (#id_token=... o #access_token=...)
  useEffect(() => {
    const hash = window.location.hash.substring(1);
    if (hash && (hash.includes('id_token=') || hash.includes('access_token='))) {
      const params = new URLSearchParams(hash);
      const token = params.get('id_token') || params.get('access_token');
      if (token) {
        setIsSubmittingCognito(true);
        loginWithToken(token)
          .then(() => {
            window.history.replaceState(null, '', window.location.pathname);
            const from = (location.state as any)?.from?.pathname || '/';
            navigate(from, { replace: true });
          })
          .catch((err: any) => {
            setErrorMsg(
              err.response?.data?.message ||
                'Error al validar el token de AWS Cognito contra el backend.',
            );
          })
          .finally(() => {
            setIsSubmittingCognito(false);
          });
      }
    }
  }, [location, loginWithToken, navigate]);

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
          'Error al conectar con la API de autenticación. Verifica que el backend esté en ejecución.',
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
          'Error al iniciar sesión con AWS Cognito. Revisa que las credenciales sean válidas.',
      );
    } finally {
      setIsSubmittingCognito(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="mx-auto w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-3xl shadow-lg mb-4">
          🏀
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">SGAOB</h1>
        <p className="mt-2 text-sm text-slate-600">
          Sistema de Gestión de Árbitros y Oficiales de Básquetbol
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-white py-8 px-6 shadow-xl border border-slate-200 sm:rounded-xl sm:px-10 space-y-6">
          {errorMsg && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg flex items-start space-x-3 text-rose-700 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Selector de modo de autenticación (Dev Agnóstico vs AWS Cognito) */}
          <div className="flex p-1 bg-slate-100 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => {
                setAuthMode('dev');
                setErrorMsg(null);
              }}
              className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center space-x-1.5 ${
                authMode === 'dev'
                  ? 'bg-white shadow-sm text-blue-700 border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Evaluación Rápida (1 Clic)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('cognito');
                setErrorMsg(null);
              }}
              className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center space-x-1.5 ${
                authMode === 'cognito'
                  ? 'bg-white shadow-sm text-blue-700 border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Cloud className="w-4 h-4 text-blue-600" />
              <span>AWS Cognito (Cloud)</span>
            </button>
          </div>

          {/* VISTA 1: Modo Evaluación Rápida (1 Clic) */}
          {authMode === 'dev' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                  <Shield className="w-5 h-5 text-blue-600" />
                  <span>Acceso de Evaluación y Desarrollo (Capstone)</span>
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Autenticación agnóstica offline: selecciona un perfil para ingresar sin dependencias externas.
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
                  className="p-4 rounded-lg border border-purple-200 bg-purple-50/50 hover:bg-purple-100/60 hover:border-purple-300 text-left transition-all flex flex-col justify-between group focus:ring-2 focus:ring-purple-500"
                >
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full inline-block mb-1.5">
                      Comisión Técnica
                    </span>
                    <h3 className="font-bold text-slate-900 text-sm group-hover:text-purple-900">
                      Administrador
                    </h3>
                    <p className="text-xs text-slate-600 mt-1">
                      Gestión total de árbitros, nominaciones y torneos.
                    </p>
                  </div>
                  <div className="mt-3 flex items-center text-xs font-semibold text-purple-700 group-hover:translate-x-1 transition-transform">
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
                  className="p-4 rounded-lg border border-blue-200 bg-blue-50/50 hover:bg-blue-100/60 hover:border-blue-300 text-left transition-all flex flex-col justify-between group focus:ring-2 focus:ring-blue-500"
                >
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full inline-block mb-1.5">
                      Árbitro de Campo
                    </span>
                    <h3 className="font-bold text-slate-900 text-sm group-hover:text-blue-900">
                      Carlos Pérez
                    </h3>
                    <p className="text-xs text-slate-600 mt-1">
                      Declaración de disponibilidad y aceptación de designaciones.
                    </p>
                  </div>
                  <div className="mt-3 flex items-center text-xs font-semibold text-blue-700 group-hover:translate-x-1 transition-transform">
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
                  className="p-4 rounded-lg border border-amber-200 bg-amber-50/50 hover:bg-amber-100/60 hover:border-amber-300 text-left transition-all flex flex-col justify-between group focus:ring-2 focus:ring-amber-500"
                >
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full inline-block mb-1.5">
                      Oficial de Mesa
                    </span>
                    <h3 className="font-bold text-slate-900 text-sm group-hover:text-amber-900">
                      Ana Gómez
                    </h3>
                    <p className="text-xs text-slate-600 mt-1">
                      Planillero, cronometrador y operador de 24 segundos.
                    </p>
                  </div>
                  <div className="mt-3 flex items-center text-xs font-semibold text-amber-700 group-hover:translate-x-1 transition-transform">
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
                  className="p-4 rounded-lg border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100/60 hover:border-emerald-300 text-left transition-all flex flex-col justify-between group focus:ring-2 focus:ring-emerald-500"
                >
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full inline-block mb-1.5">
                      Doble Rol
                    </span>
                    <h3 className="font-bold text-slate-900 text-sm group-hover:text-emerald-900">
                      Mario Silva
                    </h3>
                    <p className="text-xs text-slate-600 mt-1">
                      Acreditación combinada de Árbitro y Oficial de Mesa.
                    </p>
                  </div>
                  <div className="mt-3 flex items-center text-xs font-semibold text-emerald-700 group-hover:translate-x-1 transition-transform">
                    <span>
                      {loadingRole === 'mario.doble@sgaob.cl' ? 'Ingresando...' : 'Ingresar perfil'}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </div>
                </button>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs text-slate-600">
                <span className="font-medium">Modo activo: Token simétrico HS256 local</span>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-semibold text-[10px]">
                  Evaluación 100% Offline
                </span>
              </div>
            </div>
          )}

          {/* VISTA 2: Modo AWS Cognito Cloud */}
          {authMode === 'cognito' && (
            <div className="space-y-5">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                  <Cloud className="w-5 h-5 text-blue-600" />
                  <span>Autenticación AWS Cognito (Producción Cloud)</span>
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Inicia sesión con credenciales registradas en el User Pool de Amazon Cognito en la región us-east-1.
                </p>
              </div>

              {/* Estado de conexión de AWS Cognito */}
              {cognitoConfig?.isConfigured ? (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center space-x-2.5 text-xs text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>
                    AWS Cognito vinculado: <strong>{cognitoConfig.userPoolId}</strong> ({cognitoConfig.region})
                  </span>
                </div>
              ) : (
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-lg flex items-start space-x-2.5 text-xs text-amber-800">
                  <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">AWS Cognito pendiente de vincular:</span>
                    <p className="mt-0.5">
                      Crea tu User Pool en AWS Academy y define <code>COGNITO_USER_POOL_ID</code> y <code>COGNITO_CLIENT_ID</code> en <code>.env</code>.
                    </p>
                  </div>
                </div>
              )}

              {/* Formulario de Login Directo con Cognito */}
              <form onSubmit={handleCognitoLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
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
                      className="block w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
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
                      className="block w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingCognito}
                  className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg shadow transition-colors flex items-center justify-center space-x-2 focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {isSubmittingCognito ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Autenticando con Cognito...</span>
                    </>
                  ) : (
                    <>
                      <Cloud className="w-4 h-4" />
                      <span>Iniciar Sesión con AWS Cognito</span>
                    </>
                  )}
                </button>
              </form>

              {/* Botón de Hosted UI si fue configurado */}
              {cognitoConfig?.hostedUiUrl && (
                <div className="pt-2">
                  <div className="relative my-3">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-200" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white px-2 text-slate-400 font-semibold">O vía Hosted UI</span>
                    </div>
                  </div>

                  <a
                    href={cognitoConfig.hostedUiUrl}
                    className="w-full py-2 px-4 border border-slate-300 hover:border-slate-400 text-slate-700 font-semibold text-xs rounded-lg shadow-sm transition-colors flex items-center justify-center space-x-1.5 bg-slate-50 hover:bg-slate-100"
                  >
                    <span>Abrir Portal de Login Hosted UI de AWS</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}

              <div className="text-center">
                <p className="text-[11px] text-slate-400">
                  Validación de firma RS256 con claves públicas JWKS de Amazon Cognito.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
