import React from 'react';
import { Link } from 'react-router-dom';
import { RoleName, UserStatus } from '@sgaob/shared';
import { useAuth } from '../hooks/useAuth';
import {
  Shield,
  UserCheck,
  Calendar,
  ClipboardList,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Layers,
  Clock,
  Trophy,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user, hasRole } = useAuth();

  if (!user) return null;

  const isAdmin = hasRole(RoleName.ADMIN_COMISION_TECNICA);
  const isArbitro = hasRole(RoleName.ARBITRO);
  const isOficial = hasRole(RoleName.OFICIAL_MESA);

  return (
    <div className="space-y-8">
      {/* Banner de Bienvenida */}
      <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 sm:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full inline-block mb-2">
            Sesión Activa — SGAOB
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Hola, {user.firstName} {user.lastName}
          </h1>
          <p className="text-slate-600 text-sm mt-1">
            Bienvenido a la plataforma central de gestión arbitral y de oficiales de mesa.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {user.roles && user.roles.length > 0 ? (
            user.roles.map((r) => (
              <span
                key={r}
                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-slate-900 text-white shadow-sm"
              >
                {r === RoleName.ADMIN_COMISION_TECNICA && <Shield className="w-3.5 h-3.5 mr-1.5 text-purple-400" />}
                {r === RoleName.ARBITRO && <UserCheck className="w-3.5 h-3.5 mr-1.5 text-blue-400" />}
                {r === RoleName.OFICIAL_MESA && <UserCheck className="w-3.5 h-3.5 mr-1.5 text-amber-400" />}
                {r}
              </span>
            ))
          ) : (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
              <AlertTriangle className="w-3.5 h-3.5 mr-1.5" />
              Acreditación Pendiente
            </span>
          )}
        </div>
      </section>

      {/* Tarjetas de Estado del Perfil */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Estado de Cuenta */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Estado de Cuenta
            </span>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                user.status === UserStatus.ACTIVE
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {user.status}
            </span>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-bold text-slate-900">
              {user.status === UserStatus.ACTIVE ? 'Habilitado' : 'En Espera'}
            </p>
            <p className="text-xs text-slate-500 mt-1 font-mono">
              ID Sistema: {user.id.slice(0, 13)}...
            </p>
          </div>
        </div>

        {/* Consentimiento de Privacidad y Datos */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Consentimiento de Privacidad
            </span>
            {user.dataConsent ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-500" />
            )}
          </div>
          <div className="mt-4">
            <p className="text-2xl font-bold text-slate-900">
              {user.dataConsent ? 'Aceptado' : 'Pendiente'}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {user.dataConsent
                ? 'Términos de privacidad y datos registrados.'
                : 'Falta confirmar consentimiento formal.'}
            </p>
          </div>
        </div>

        {/* Acreditación Técnica */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Acreditaciones Activas
            </span>
            <Layers className="w-5 h-5 text-blue-600" />
          </div>
          <div className="mt-4">
            <p className="text-2xl font-bold text-slate-900">
              {user.roles?.length || 0} Rol(es)
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {isArbitro && isOficial
                ? 'Doble acreditación independiente'
                : isArbitro
                ? 'Árbitro de campo'
                : isOficial
                ? 'Oficial de mesa técnica'
                : isAdmin
                ? 'Comisión Técnica Administrativa'
                : 'Sin acreditaciones'}
            </p>
          </div>
        </div>
      </section>

      {/* Acciones Rápidas Disponibles según Rol */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Acciones Principales</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {isAdmin && (
            <Link
              to="/usuarios"
              className="p-6 bg-white rounded-xl border border-slate-200 hover:border-purple-300 hover:shadow-md transition-all group flex flex-col justify-between cursor-pointer"
            >
              <div>
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center text-purple-700 mb-4 group-hover:scale-105 transition-transform">
                  <Shield className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 group-hover:text-purple-700 transition-colors">
                  Gestión de Usuarios y Acreditaciones
                </h3>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                  Administra perfiles de árbitros y oficiales de mesa, asigna acreditaciones independientes y gestiona estados.
                </p>
              </div>
              <div className="mt-4 flex items-center text-xs font-bold text-purple-700 group-hover:translate-x-1 transition-transform">
                <span>Acceder a la grilla</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </div>
            </Link>
          )}

          {(isArbitro || isOficial) && (
            <Link
              to="/disponibilidad"
              className="p-6 bg-white rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all group flex flex-col justify-between cursor-pointer"
            >
              <div>
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700 mb-4 group-hover:scale-105 transition-transform">
                  <Calendar className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                  Declarar Disponibilidad Semanal
                </h3>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                  Declara tus bloques horarios para la semana (Horario 1, Horario 2, Full o No Disponible).
                </p>
              </div>
              <div className="mt-4 flex items-center text-xs font-bold text-blue-700 group-hover:translate-x-1 transition-transform">
                <span>Ir al calendario</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </div>
            </Link>
          )}

          <Link
            to="/partidos"
            className="p-6 bg-white rounded-xl border border-slate-200 hover:border-amber-300 hover:shadow-md transition-all group flex flex-col justify-between cursor-pointer"
          >
            <div>
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700 mb-4 group-hover:scale-105 transition-transform">
                <Trophy className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 group-hover:text-amber-700 transition-colors">
                Cartelera Oficial de Partidos
              </h3>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                Consulta partidos oficiales, gestiona reprogramaciones, estados y sincronización bajo demanda.
              </p>
            </div>
            <div className="mt-4 flex items-center text-xs font-bold text-amber-700 group-hover:translate-x-1 transition-transform">
              <span>Ir a la cartelera</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </div>
          </Link>

          <Link
            to="/nominaciones"
            className="p-6 bg-white rounded-xl border border-slate-200 hover:border-emerald-300 hover:shadow-md transition-all group flex flex-col justify-between cursor-pointer"
          >
            <div>
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 mb-4 group-hover:scale-105 transition-transform">
                <ClipboardList className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                Designaciones y Asignaciones
              </h3>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                Visualiza partidos sincronizados de NBN23/Swish y el estado de asignaciones arbitrales.
              </p>
            </div>
            <div className="mt-4 flex items-center text-xs font-bold text-emerald-700 group-hover:translate-x-1 transition-transform">
              <span>Ver partidos</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </div>
          </Link>
        </div>
      </section>

      {/* Panel Informativo de Operaciones y Reglas Vigentes */}
      <section className="bg-slate-900 text-white rounded-xl p-6 sm:p-8 space-y-4 shadow-md">
        <div className="flex items-center space-x-2 text-blue-400 font-bold text-sm uppercase tracking-wider">
          <Clock className="w-4 h-4" />
          <span>Panel Operativo del Sistema</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="bg-slate-800/80 p-4 rounded-lg border border-slate-700 space-y-1">
            <span className="text-slate-400 block font-medium">Plazo de Disponibilidad</span>
            <span className="text-white font-bold block text-sm">Miércoles 23:59 hrs</span>
            <p className="text-slate-400 text-[11px]">Cierre automático para la programación semanal.</p>
          </div>
          <div className="bg-slate-800/80 p-4 rounded-lg border border-slate-700 space-y-1">
            <span className="text-slate-400 block font-medium">Cartelera Externa</span>
            <span className="text-white font-bold block text-sm">Swish / NBN23</span>
            <p className="text-slate-400 text-[11px]">Sincronización directa y detección de reprogramaciones.</p>
          </div>
          <div className="bg-slate-800/80 p-4 rounded-lg border border-slate-700 space-y-1">
            <span className="text-slate-400 block font-medium">Confirmación de Designaciones</span>
            <span className="text-white font-bold block text-sm">48 hrs Previas</span>
            <p className="text-slate-400 text-[11px]">Respuesta obligatoria para asegurar la terna arbitral.</p>
          </div>
          <div className="bg-slate-800/80 p-4 rounded-lg border border-slate-700 space-y-1">
            <span className="text-slate-400 block font-medium">Acreditaciones Técnicas</span>
            <span className="text-white font-bold block text-sm">Independientes</span>
            <p className="text-slate-400 text-[11px]">Funciones de árbitro y oficial de mesa diferenciadas.</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default DashboardPage;
