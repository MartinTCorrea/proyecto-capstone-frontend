import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { UserStatus, NominationStatus, MatchRole } from '@sgaob/shared';
import { availabilityApi, AvailabilitySummaryResponse } from '../../api/availability.api';
import { usersApi } from '../../api/users.api';
import { matchesApi, MatchItem } from '../../api/matches.api';
import { nominationsApi } from '../../api/nominations.api';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { getUpcomingCycleDates, analyzeMatchCoverage } from './dashboardUtils';
import {
  Calendar,
  Clock,
  Trophy,
  ClipboardList,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Shield,
} from 'lucide-react';

export const AdminDashboardView: React.FC = () => {
  const [cycle] = useState(() => getUpcomingCycleDates());
  const [loading, setLoading] = useState(true);
  const [summaryData, setSummaryData] = useState<AvailabilitySummaryResponse | null>(null);
  const [totalActivePersonnel, setTotalActivePersonnel] = useState(0);
  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [pendingNominationsCount, setPendingNominationsCount] = useState(0);
  const [rejectedNominationsCount, setRejectedNominationsCount] = useState(0);

  const loadAdminMetrics = useCallback(async () => {
    setLoading(true);
    try {
      const [
        availSummary,
        usersRes,
        matchesRes,
        pendingNomRes,
        rejectedNomRes,
      ] = await Promise.all([
        availabilityApi.getAvailabilitySummary({ date: cycle.saturdayStr }).catch(() => null),
        usersApi.getUsers({ status: UserStatus.ACTIVE, limit: 1 }).catch(() => null),
        matchesApi.getMatches({ page: 1, limit: 15 }).catch(() => null),
        nominationsApi.getNominations({ page: 1, limit: 1, status: NominationStatus.PENDING }).catch(() => null),
        nominationsApi.getNominations({ page: 1, limit: 1, status: NominationStatus.REJECTED }).catch(() => null),
      ]);

      if (availSummary) setSummaryData(availSummary);
      if (usersRes) setTotalActivePersonnel(usersRes.meta.total);
      if (matchesRes) setMatches(matchesRes.data);
      if (pendingNomRes) setPendingNominationsCount(pendingNomRes.meta.total);
      if (rejectedNomRes) setRejectedNominationsCount(rejectedNomRes.meta.total);
    } catch (err) {
      console.error('Error cargando métricas administrativas:', err);
    } finally {
      setLoading(false);
    }
  }, [cycle.saturdayStr]);

  useEffect(() => {
    loadAdminMetrics();
  }, [loadAdminMetrics]);

  if (loading) {
    return (
      <div className="py-16 flex flex-col items-center justify-center space-y-3">
        <LoadingSpinner size="lg" />
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
          Cargando indicadores operativos de la Comisión Técnica...
        </p>
      </div>
    );
  }

  // Cálculos de Adhesión de Disponibilidad
  const totalAvailable = summaryData?.totalAvailable || 0;
  const participationPercentage = totalActivePersonnel > 0
    ? Math.min(100, Math.round((totalAvailable / totalActivePersonnel) * 100))
    : 0;

  const counts = summaryData?.counts || { FULL: 0, HORARIO_1: 0, HORARIO_2: 0, NO: 0 };

  // Cálculos de Cobertura de Partidos
  const matchesAnalysis = matches.map((m) => ({
    match: m,
    coverage: analyzeMatchCoverage(m),
  }));

  const fullyStaffedCount = matchesAnalysis.filter((item) => item.coverage.isFullyStaffed).length;
  const matchesNeedingAttention = matchesAnalysis.filter(
    (item) => !item.coverage.isFullyStaffed || item.coverage.hasRejection,
  );

  return (
    <div className="space-y-8">
      {/* Banner Informativo del Ciclo Vigente */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-purple-400 text-xs font-bold uppercase tracking-wider">
            <Calendar className="w-4 h-4" />
            <span>Ciclo Operativo Vigente</span>
          </div>
          <h2 className="text-xl font-extrabold text-white">
            {cycle.cycleLabel}
          </h2>
          <p className="text-slate-400 text-xs">
            Planificación y asignaciones de la Comisión Técnica para el fin de semana oficial.
          </p>
        </div>

        <div>
          {cycle.isPastDeadline ? (
            <div className="inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-semibold bg-rose-950/80 text-rose-300 border border-rose-800">
              <Clock className="w-4 h-4 mr-1.5 text-rose-400" />
              <span>Plazo cerrado para este ciclo ({cycle.formattedDeadline})</span>
            </div>
          ) : (
            <div className="inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-semibold bg-purple-950/80 text-purple-200 border border-purple-800">
              <Clock className="w-4 h-4 mr-1.5 text-purple-400" />
              <span>Cierre de disponibilidad: Miércoles 23:59 ({cycle.hoursRemaining}h restantes)</span>
            </div>
          )}
        </div>
      </div>

      {/* Grid de KPIs Operativos Clave */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* KPI 1: Disponibilidad Semanal */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Disponibilidad Semanal
              </span>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-slate-800 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/40">
                {participationPercentage}% adhesión
              </span>
            </div>

            <div className="mt-4">
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  {totalAvailable}
                </span>
                <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                  de {totalActivePersonnel} activos
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Árbitros y oficiales con bloques declarados para el ciclo.
              </p>
            </div>

            {/* Barra de progreso */}
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 mt-4 overflow-hidden">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${participationPercentage}%` }}
              />
            </div>

            {/* Mini Desglose por Bloques */}
            <div className="grid grid-cols-4 gap-1 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
              <div>
                <span className="text-2xs font-bold text-emerald-700 dark:text-emerald-400 uppercase block">Full</span>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{counts.FULL}</span>
              </div>
              <div>
                <span className="text-2xs font-bold text-blue-700 dark:text-blue-400 uppercase block">Hor. 1</span>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{counts.HORARIO_1}</span>
              </div>
              <div>
                <span className="text-2xs font-bold text-amber-700 dark:text-amber-400 uppercase block">Hor. 2</span>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{counts.HORARIO_2}</span>
              </div>
              <div>
                <span className="text-2xs font-bold text-rose-700 dark:text-rose-400 uppercase block">No Disp</span>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{counts.NO}</span>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Link
              to="/disponibilidad"
              className="inline-flex items-center text-xs font-bold text-blue-700 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors group cursor-pointer"
            >
              <span>Ver padrón consolidado</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        {/* KPI 2: Cobertura de Cartelera */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Cobertura de Partidos
              </span>
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                matchesNeedingAttention.length === 0
                  ? 'bg-emerald-50 dark:bg-slate-800 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/40'
                  : 'bg-amber-50 dark:bg-slate-800 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/40'
              }`}>
                {fullyStaffedCount} de {matches.length} cubiertos
              </span>
            </div>

            <div className="mt-4">
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  {matches.length}
                </span>
                <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                  partidos programados
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {matchesNeedingAttention.length === 0
                  ? 'Todas las ternas están completas.'
                  : `${matchesNeedingAttention.length} partido(s) con vacantes en su terna.`}
              </p>
            </div>

            {/* Indicador de dotación */}
            <div className="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-600 dark:text-slate-400 font-medium">Ternas Completas:</span>
                <span className="font-bold text-emerald-700 dark:text-emerald-400">{fullyStaffedCount}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-600 dark:text-slate-400 font-medium">Partidos con Vacantes:</span>
                <span className={`font-bold ${matchesNeedingAttention.length > 0 ? 'text-amber-700 dark:text-amber-400' : 'text-slate-500 dark:text-slate-400'}`}>
                  {matchesNeedingAttention.length}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Link
              to="/partidos"
              className="inline-flex items-center text-xs font-bold text-amber-700 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300 transition-colors group cursor-pointer"
            >
              <span>Ir a la cartelera oficial</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        {/* KPI 3: Estado de Designaciones */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Designaciones Activas
              </span>
              {rejectedNominationsCount > 0 ? (
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-rose-50 dark:bg-slate-800 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/40">
                  {rejectedNominationsCount} rechazo(s)
                </span>
              ) : (
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-slate-800 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/40">
                  Sin rechazos
                </span>
              )}
            </div>

            <div className="mt-4">
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  {pendingNominationsCount}
                </span>
                <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                  por ratificar
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Asignaciones esperando confirmación del personal arbitral.
              </p>
            </div>

            <div className="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-600 dark:text-slate-400 font-medium">Pendientes de confirmación:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{pendingNominationsCount}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-600 dark:text-slate-400 font-medium">Rechazos que requieren reemplazo:</span>
                <span className={`font-bold ${rejectedNominationsCount > 0 ? 'text-rose-700 dark:text-rose-400' : 'text-slate-500 dark:text-slate-400'}`}>
                  {rejectedNominationsCount}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Link
              to="/nominaciones"
              className="inline-flex items-center text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 transition-colors group cursor-pointer"
            >
              <span>Gestionar asignaciones</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* Partidos que Requieren Atención Inmediata */}
      <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-5 transition-colors duration-200">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <span>Partidos que Requieren Atención</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Partidos próximos con vacantes de arbitraje o con rechazos pendientes de reasignación.
            </p>
          </div>

          <Link
            to="/nominaciones"
            className="text-xs font-bold text-purple-700 dark:text-purple-400 hover:text-purple-900 dark:hover:text-purple-300 transition-colors inline-flex items-center"
          >
            <span>Ver todas las asignaciones</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Link>
        </div>

        {matchesNeedingAttention.length === 0 ? (
          <div className="p-6 rounded-xl bg-emerald-50 dark:bg-slate-800/60 border border-emerald-200 dark:border-emerald-900/40 flex items-center space-x-3 text-emerald-800 dark:text-emerald-300">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            <div>
              <p className="text-sm font-bold">Todas las ternas están completas</p>
              <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">
                No existen partidos con vacantes ni rechazos activos en los compromisos programados.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {matchesNeedingAttention.slice(0, 4).map(({ match, coverage }) => {
              const formattedDate = new Date(match.matchDateTime).toLocaleDateString('es-CL', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={match.id}
                  className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-purple-300 dark:hover:border-slate-700 bg-white dark:bg-slate-800/60 hover:shadow-sm transition-all space-y-3"
                >
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <span className="text-caption font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-slate-700 px-2 py-0.5 rounded-full inline-block">
                        {match.tournament} • {match.category}
                      </span>
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm mt-1.5">
                        {match.homeTeam} vs {match.awayTeam}
                      </h4>
                    </div>

                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {formattedDate}
                    </span>
                  </div>

                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-medium text-slate-700 dark:text-slate-300">Recinto:</span> {match.venue}
                  </div>

                  {/* Vacantes detectadas */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-700/60">
                    <span className="text-caption font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                      Estado de Terna:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {coverage.missingRoles.map((role) => (
                        <span
                          key={role}
                          className="inline-flex items-center px-2 py-0.5 rounded-md text-caption font-semibold bg-amber-50 dark:bg-slate-800 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900/40"
                        >
                          Falta {role === MatchRole.ARBITRO_PRINCIPAL ? 'Árbitro Principal' : role === MatchRole.ARBITRO_1 ? 'Árbitro 1' : 'Oficial de Mesa'}
                        </span>
                      ))}

                      {coverage.hasRejection && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-caption font-semibold bg-rose-50 dark:bg-slate-800 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-900/40">
                          Rechazo registrado
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <Link
                      to="/nominaciones"
                      className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-900 dark:bg-slate-700 text-white hover:bg-purple-700 dark:hover:bg-purple-600 transition-colors cursor-pointer"
                    >
                      <span>Gestionar Terna</span>
                      <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Accesos Rápidos Operativos */}
      <section className="space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white">Módulos de Gestión Operativa</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            to="/nominaciones"
            className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-slate-700 hover:shadow-sm transition-all group flex flex-col justify-between cursor-pointer"
          >
            <div>
              <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-slate-800 border dark:border-emerald-900/40 flex items-center justify-center text-emerald-700 dark:text-emerald-400 mb-3 group-hover:scale-105 transition-transform">
                <ClipboardList className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-900 dark:text-white text-sm group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                Designaciones Técnicas
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Asigna árbitros y oficiales con validación dura y cruce de disponibilidad.
              </p>
            </div>
            <div className="mt-4 flex items-center text-xs font-bold text-emerald-700 dark:text-emerald-400 group-hover:translate-x-1 transition-transform">
              <span>Ir a designaciones</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </div>
          </Link>

          <Link
            to="/partidos"
            className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-amber-300 dark:hover:border-slate-700 hover:shadow-sm transition-all group flex flex-col justify-between cursor-pointer"
          >
            <div>
              <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-slate-800 border dark:border-amber-900/40 flex items-center justify-center text-amber-700 dark:text-amber-400 mb-3 group-hover:scale-105 transition-transform">
                <Trophy className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-900 dark:text-white text-sm group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors">
                Cartelera Oficial
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Consulta partidos, reprogramaciones y sincronización NBN23 / Swish.
              </p>
            </div>
            <div className="mt-4 flex items-center text-xs font-bold text-amber-700 dark:text-amber-400 group-hover:translate-x-1 transition-transform">
              <span>Ir a partidos</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </div>
          </Link>

          <Link
            to="/disponibilidad"
            className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-slate-700 hover:shadow-sm transition-all group flex flex-col justify-between cursor-pointer"
          >
            <div>
              <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-slate-800 border dark:border-blue-900/40 flex items-center justify-center text-blue-700 dark:text-blue-400 mb-3 group-hover:scale-105 transition-transform">
                <Calendar className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-900 dark:text-white text-sm group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">
                Consolidado Disponibilidad
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Filtra el padrón de disponibles por fecha, bloque y acreditación.
              </p>
            </div>
            <div className="mt-4 flex items-center text-xs font-bold text-blue-700 dark:text-blue-400 group-hover:translate-x-1 transition-transform">
              <span>Ver reporte</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </div>
          </Link>

          <Link
            to="/usuarios"
            className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-purple-300 dark:hover:border-slate-700 hover:shadow-sm transition-all group flex flex-col justify-between cursor-pointer"
          >
            <div>
              <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-slate-800 border dark:border-purple-900/40 flex items-center justify-center text-purple-700 dark:text-purple-400 mb-3 group-hover:scale-105 transition-transform">
                <Shield className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-900 dark:text-white text-sm group-hover:text-purple-700 dark:group-hover:text-purple-400 transition-colors">
                Usuarios y Roles
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Administra acreditaciones independientes de árbitro y oficial de mesa.
              </p>
            </div>
            <div className="mt-4 flex items-center text-xs font-bold text-purple-700 dark:text-purple-400 group-hover:translate-x-1 transition-transform">
              <span>Gestionar usuarios</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </div>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default AdminDashboardView;
