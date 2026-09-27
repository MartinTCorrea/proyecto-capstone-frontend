import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { RoleName } from '@sgaob/shared';
import { useAuth } from '../hooks/useAuth';
import { Shield, Lock, ArrowRight, AlertCircle } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { loginWithDevToken, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loadingRole, setLoadingRole] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Redirigir si ya está autenticado
  React.useEffect(() => {
    if (isAuthenticated) {
      const from = (location.state as any)?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

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
        err.response?.data?.message || 'Error al conectar con la API de autenticación. Verifica que el backend esté corriendo.',
      );
    } finally {
      setLoadingRole(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="mx-auto w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-3xl shadow-lg mb-4">
          🏀
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          SGAOB
        </h1>
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

          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <Shield className="w-5 h-5 text-blue-600" />
              <span>Acceso de Evaluación y Desarrollo (Capstone)</span>
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Selecciona un perfil para iniciar sesión con token JWT validado por el backend:
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Perfil 1: Admin */}
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
                  Acceso completo a gestión de árbitros, roles y partidos.
                </p>
              </div>
              <div className="mt-3 flex items-center text-xs font-semibold text-purple-700 group-hover:translate-x-1 transition-transform">
                <span>Ingresar perfil</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </div>
            </button>

            {/* Perfil 2: Árbitro */}
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
                  Declaración de disponibilidad y aceptación de partidos.
                </p>
              </div>
              <div className="mt-3 flex items-center text-xs font-semibold text-blue-700 group-hover:translate-x-1 transition-transform">
                <span>Ingresar perfil</span>
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
                <span>Ingresar perfil</span>
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
                  Doble Rol Independiente
                </span>
                <h3 className="font-bold text-slate-900 text-sm group-hover:text-emerald-900">
                  Mario Silva
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  Posee acreditación simultánea de Árbitro y Oficial de Mesa.
                </p>
              </div>
              <div className="mt-3 flex items-center text-xs font-semibold text-emerald-700 group-hover:translate-x-1 transition-transform">
                <span>Ingresar perfil</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </div>
            </button>
          </div>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-3 text-slate-400 font-semibold">O autenticación institucional</span>
            </div>
          </div>

          <div>
            <button
              type="button"
              disabled
              className="w-full flex justify-center items-center py-2.5 px-4 border border-slate-300 rounded-lg shadow-sm text-sm font-semibold text-slate-400 bg-slate-50 cursor-not-allowed"
            >
              <Lock className="w-4 h-4 mr-2" />
              <span>Conectar con AWS Cognito / Azure ID (Modo Nube)</span>
            </button>
            <p className="mt-2 text-center text-[11px] text-slate-400">
              Integración OIDC configurada y lista mediante JWKS RS256.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
