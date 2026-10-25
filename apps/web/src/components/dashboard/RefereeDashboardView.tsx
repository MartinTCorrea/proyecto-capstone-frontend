import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { NominationStatus, AvailabilityBlock } from '@sgaob/shared';
import { availabilityApi, UserAvailabilityRecord } from '../../api/availability.api';
import { nominationsApi, NominationItem } from '../../api/nominations.api';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { MatchRoleBadge } from '../nominations/MatchRoleBadge';
import { RespondNominationModal } from '../nominations/RespondNominationModal';
import { getUpcomingCycleDates } from './dashboardUtils';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Trophy,
  ClipboardList,
  FileText,
  MapPin,
  Check,
  X,
  CalendarCheck,
  Calendar,
} from 'lucide-react';

export const RefereeDashboardView: React.FC = () => {
  const [cycle] = useState(() => getUpcomingCycleDates());
  const [loading, setLoading] = useState(true);
  const [myAvailabilities, setMyAvailabilities] = useState<UserAvailabilityRecord[]>([]);
  const [myNominations, setMyNominations] = useState<NominationItem[]>([]);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  // Modal para rechazar con motivo obligatorio
  const [respondModalOpen, setRespondModalOpen] = useState(false);
  const [selectedNominationForRespond, setSelectedNominationForRespond] =
    useState<NominationItem | null>(null);

  const loadPersonalData = useCallback(async () => {
    setLoading(true);
    try {
      const [availRes, nomRes] = await Promise.all([
        availabilityApi.getMyAvailability({
          startDate: cycle.mondayStr,
          endDate: cycle.sundayStr,
        }).catch(() => []),
        nominationsApi.getNominations({ page: 1, limit: 10 }).catch(() => ({ data: [], meta: { total: 0, page: 1, limit: 10, totalPages: 0 } })),
      ]);

      setMyAvailabilities(availRes || []);
      setMyNominations(nomRes?.data || []);
    } catch (err) {
      console.error('Error al cargar datos del árbitro/oficial:', err);
    } finally {
      setLoading(false);
    }
  }, [cycle.mondayStr, cycle.sundayStr]);

  useEffect(() => {
    loadPersonalData();
  }, [loadPersonalData]);

  // Manejador de confirmación rápida
  const handleQuickConfirm = async (nominationId: string) => {
    setConfirmingId(nominationId);
    try {
      await nominationsApi.respondNomination(nominationId, {
        status: NominationStatus.CONFIRMED,
      });
      await loadPersonalData();
    } catch (err) {
      console.error('Error al confirmar designación:', err);
    } finally {
      setConfirmingId(null);
    }
  };

  // Abrir modal de rechazo
  const handleOpenRejectModal = (nomination: NominationItem) => {
    setSelectedNominationForRespond(nomination);
    setRespondModalOpen(true);
  };

  if (loading) {
    return (
      <div className="py-16 flex flex-col items-center justify-center space-y-3">
        <LoadingSpinner size="lg" />
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
          Cargando tu información arbitral y designaciones...
        </p>
      </div>
    );
  }

  // Comprobar declaración de disponibilidad para sábado y domingo
  const saturdayAvail = myAvailabilities.find((a) => a.date === cycle.saturdayStr);
  const sundayAvail = myAvailabilities.find((a) => a.date === cycle.sundayStr);
  const hasDeclaredWeekend = Boolean(saturdayAvail || sundayAvail);

  // Clasificar nominaciones
  const pendingNominations = myNominations.filter(
    (n) => n.status === NominationStatus.PENDING,
  );

  const confirmedUpcomingMatches = myNominations
    .filter((n) => n.status === NominationStatus.CONFIRMED && n.match)
    .sort((a, b) => {
      const dateA = new Date(a.match?.matchDateTime || 0).getTime();
      const dateB = new Date(b.match?.matchDateTime || 0).getTime();
      return dateA - dateB;
    });

  const getBlockLabel = (block?: AvailabilityBlock) => {
    switch (block) {
      case AvailabilityBlock.FULL:
        return 'Jornada Completa (Full)';
      case AvailabilityBlock.HORARIO_1:
        return 'Horario 1';
      case AvailabilityBlock.HORARIO_2:
        return 'Horario 2';
      case AvailabilityBlock.NO:
        return 'No Disponible';
      default:
        return 'No Registrado';
    }
  };

  const getBlockBadgeColor = (block?: AvailabilityBlock) => {
    switch (block) {
      case AvailabilityBlock.FULL:
        return 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-slate-800 dark:text-emerald-300 dark:border-emerald-900/40';
      case AvailabilityBlock.HORARIO_1:
        return 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-slate-800 dark:text-blue-300 dark:border-blue-900/40';
      case AvailabilityBlock.HORARIO_2:
        return 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-slate-800 dark:text-amber-300 dark:border-amber-900/40';
      case AvailabilityBlock.NO:
        return 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-slate-800 dark:text-rose-300 dark:border-rose-900/40';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700';
    }
  };

  return (
    <div className="space-y-8">
      {/* 1. Semáforo Personal de Disponibilidad Semanal */}
      <section>
        {hasDeclaredWeekend ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-7 shadow-sm space-y-4 transition-colors duration-200">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-slate-800 border dark:border-emerald-900/40 flex items-center justify-center text-emerald-700 dark:text-emerald-400 flex-shrink-0">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-caption font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">
                    Disponibilidad Registrada
                  </span>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                    Tu disponibilidad para el {cycle.cycleLabel} está confirmada
                  </h3>
                </div>
              </div>

              {!cycle.isPastDeadline ? (
                <Link
                  to="/disponibilidad"
                  className="px-4 py-2 rounded-xl text-xs font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-slate-700 border dark:border-blue-900/40 transition-colors inline-flex items-center cursor-pointer"
                >
                  <span>Modificar Mi Disponibilidad</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </Link>
              ) : (
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full border dark:border-slate-700">
                  Plazo cerrado para este ciclo
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">Sábado ({cycle.saturdayStr}):</div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${getBlockBadgeColor(saturdayAvail?.block)}`}>
                  {getBlockLabel(saturdayAvail?.block)}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">Domingo ({cycle.sundayStr}):</div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${getBlockBadgeColor(sundayAvail?.block)}`}>
                  {getBlockLabel(sundayAvail?.block)}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-amber-50/80 dark:bg-slate-900 rounded-2xl border border-amber-200 dark:border-amber-900/40 p-6 sm:p-7 shadow-sm space-y-4 transition-colors duration-200">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-start space-x-3.5">
                <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-slate-800 border dark:border-amber-900/40 flex items-center justify-center text-amber-700 dark:text-amber-400 flex-shrink-0 mt-0.5">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-caption font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wider">
                      Atención Requerida
                    </span>
                    <span className="text-2xs font-bold px-2 py-0.5 rounded-full bg-amber-200 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border dark:border-amber-800/40">
                      Pendiente
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                    Aún no has declarado tu disponibilidad para el {cycle.cycleLabel}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
                    El plazo de cierre automático vence este <strong>miércoles a las 23:59 hrs</strong>.
                    Recuerda que la Comisión Técnica requiere tu declaración para considerarte en las designaciones oficiales.
                  </p>
                </div>
              </div>

              <Link
                to="/disponibilidad"
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-sm transition-colors inline-flex items-center whitespace-nowrap cursor-pointer flex-shrink-0"
              >
                <span>Declarar Mi Disponibilidad Ahora</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* 2. Designaciones Pendientes de Respuesta (Alerta de Alta Prioridad) */}
      {pendingNominations.length > 0 && (
        <section className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-amber-300 dark:border-amber-800/60 p-6 sm:p-8 shadow-sm space-y-5 transition-colors duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-3 h-3 rounded-full bg-amber-500 dark:bg-amber-400 animate-pulse" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Designaciones Pendientes de Respuesta ({pendingNominations.length})
              </h3>
            </div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Confirmación obligatoria (48 hrs previas)
            </span>
          </div>

          <div className="space-y-4">
            {pendingNominations.map((nomination) => {
              const match = nomination.match;
              if (!match) return null;

              const formattedDate = new Date(match.matchDateTime).toLocaleDateString('es-CL', {
                weekday: 'long',
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={nomination.id}
                  className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                >
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <MatchRoleBadge role={nomination.matchRole} />
                      <span className="text-xs font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-slate-800 border dark:border-purple-900/40 px-2.5 py-0.5 rounded-md">
                        {match.tournament} • {match.category}
                      </span>
                    </div>

                    <h4 className="text-base font-bold text-slate-900 dark:text-white">
                      {match.homeTeam} vs {match.awayTeam}
                    </h4>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                      <span className="flex items-center">
                        <Clock className="w-3.5 h-3.5 mr-1 text-slate-400" />
                        {formattedDate}
                      </span>
                      <span className="flex items-center">
                        <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400" />
                        {match.venue}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 w-full md:w-auto">
                    <button
                      type="button"
                      onClick={() => handleQuickConfirm(nomination.id)}
                      disabled={confirmingId === nomination.id}
                      className="flex-1 md:flex-initial px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors inline-flex items-center justify-center shadow-sm cursor-pointer disabled:opacity-50"
                    >
                      {confirmingId === nomination.id ? (
                        <LoadingSpinner size="sm" />
                      ) : (
                        <>
                          <Check className="w-4 h-4 mr-1.5" />
                          <span>Confirmar Asistencia</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenRejectModal(nomination)}
                      disabled={confirmingId === nomination.id}
                      className="flex-1 md:flex-initial px-4 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors inline-flex items-center justify-center cursor-pointer disabled:opacity-50"
                    >
                      <X className="w-4 h-4 mr-1.5" />
                      <span>Rechazar Designación...</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 3. Próximos Partidos Confirmados */}
      <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-5 transition-colors duration-200">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <CalendarCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span>Tus Próximos Partidos Confirmados</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Compromisos ratificados en los que participarás como parte de la terna arbitral.
            </p>
          </div>

          <Link
            to="/nominaciones"
            className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:text-emerald-900 dark:hover:text-emerald-300 transition-colors inline-flex items-center"
          >
            <span>Ver historial completo</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Link>
        </div>

        {confirmedUpcomingMatches.length === 0 ? (
          <div className="p-8 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-center space-y-2">
            <Trophy className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              No tienes partidos asignados para esta semana
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              Cuando la Comisión Técnica publique las designaciones oficiales, tus partidos ratificados aparecerán aquí con sus horarios y recintos.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {confirmedUpcomingMatches.slice(0, 4).map((nomination) => {
              const match = nomination.match;
              if (!match) return null;

              const formattedDate = new Date(match.matchDateTime).toLocaleDateString('es-CL', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={nomination.id}
                  className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 hover:border-emerald-300 dark:hover:border-slate-700 hover:shadow-sm transition-all space-y-3"
                >
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <span className="text-caption font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full inline-block">
                        {match.tournament} • {match.category}
                      </span>
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm mt-1.5">
                        {match.homeTeam} vs {match.awayTeam}
                      </h4>
                    </div>

                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-slate-800 border border-emerald-200 dark:border-emerald-900/40 px-2 py-0.5 rounded-md whitespace-nowrap">
                      Confirmado
                    </span>
                  </div>

                  <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400 pt-1">
                    <div className="flex items-center">
                      <Clock className="w-3.5 h-3.5 mr-1.5 text-slate-400 flex-shrink-0" />
                      <span>{formattedDate}</span>
                    </div>
                    <div className="flex items-center">
                      <MapPin className="w-3.5 h-3.5 mr-1.5 text-slate-400 flex-shrink-0" />
                      <span>{match.venue}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
                    <MatchRoleBadge role={nomination.matchRole} />
                    <Link
                      to="/partidos"
                      className="text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white inline-flex items-center"
                    >
                      <span>Ver cartelera</span>
                      <ArrowRight className="w-3 h-3 ml-1" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 4. Accesos Rápidos para el Personal Arbitral */}
      <section className="space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white">Funciones y Herramientas del Personal</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            to="/disponibilidad"
            className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-slate-700 hover:shadow-sm transition-all group flex flex-col justify-between cursor-pointer"
          >
            <div>
              <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-slate-800 border dark:border-blue-900/40 flex items-center justify-center text-blue-700 dark:text-blue-400 mb-3 group-hover:scale-105 transition-transform">
                <Calendar className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-900 dark:text-white text-sm group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">
                Declarar Disponibilidad
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Selecciona tus bloques horarios para los fines de semana de competencia.
              </p>
            </div>
            <div className="mt-4 flex items-center text-xs font-bold text-blue-700 dark:text-blue-400 group-hover:translate-x-1 transition-transform">
              <span>Ir al calendario</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </div>
          </Link>

          <Link
            to="/nominaciones"
            className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-slate-700 hover:shadow-sm transition-all group flex flex-col justify-between cursor-pointer"
          >
            <div>
              <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-slate-800 border dark:border-emerald-900/40 flex items-center justify-center text-emerald-700 dark:text-emerald-400 mb-3 group-hover:scale-105 transition-transform">
                <ClipboardList className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-900 dark:text-white text-sm group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                Mis Designaciones
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Revisa el historial de tus asignaciones y confirma o rechaza partidos.
              </p>
            </div>
            <div className="mt-4 flex items-center text-xs font-bold text-emerald-700 dark:text-emerald-400 group-hover:translate-x-1 transition-transform">
              <span>Ver designaciones</span>
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
                Cartelera de Partidos
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Consulta la programación general, recintos y horarios de la liga.
              </p>
            </div>
            <div className="mt-4 flex items-center text-xs font-bold text-amber-700 dark:text-amber-400 group-hover:translate-x-1 transition-transform">
              <span>Ver partidos</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </div>
          </Link>

          <Link
            to="/recursos"
            className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-purple-300 dark:hover:border-slate-700 hover:shadow-sm transition-all group flex flex-col justify-between cursor-pointer"
          >
            <div>
              <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-slate-800 border dark:border-purple-900/40 flex items-center justify-center text-purple-700 dark:text-purple-400 mb-3 group-hover:scale-105 transition-transform">
                <FileText className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-900 dark:text-white text-sm group-hover:text-purple-700 dark:group-hover:text-purple-400 transition-colors">
                Reglamentos y Recursos
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Descarga circulares técnicas, bases de torneos y manuales oficiales.
              </p>
            </div>
            <div className="mt-4 flex items-center text-xs font-bold text-purple-700 dark:text-purple-400 group-hover:translate-x-1 transition-transform">
              <span>Consultar recursos</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </div>
          </Link>
        </div>
      </section>

      {/* Modal de Respuesta con Motivo de Rechazo Obligatorio */}
      <RespondNominationModal
        isOpen={respondModalOpen}
        onClose={() => {
          setRespondModalOpen(false);
          setSelectedNominationForRespond(null);
        }}
        nomination={selectedNominationForRespond}
        onResponded={async () => {
          setRespondModalOpen(false);
          setSelectedNominationForRespond(null);
          await loadPersonalData();
        }}
      />
    </div>
  );
};

export default RefereeDashboardView;
