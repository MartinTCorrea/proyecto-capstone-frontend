import React, { useState, useEffect } from 'react';
import { MatchRole, RoleName } from '@sgaob/shared';
import {
  nominationsApi,
  AvailableCandidatesResponse,
} from '../../api/nominations.api';
import { MatchItem } from '../../api/matches.api';
import { MatchRoleBadge } from './MatchRoleBadge';
import {
  X,
  AlertTriangle,
  UserCheck,
  UserX,
  Shield,
  Send,
  Info,
  Calendar,
  MapPin,
  Clock,
} from 'lucide-react';

interface AssignNominationModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: MatchItem | null;
  initialRole?: MatchRole;
  onNominationCreated: () => void;
}

const ALL_ROLES: { role: MatchRole; label: string; systemRole: RoleName }[] = [
  { role: MatchRole.ARBITRO_PRINCIPAL, label: 'Árbitro Principal', systemRole: RoleName.ARBITRO },
  { role: MatchRole.ARBITRO_1, label: 'Árbitro 1', systemRole: RoleName.ARBITRO },
  { role: MatchRole.ARBITRO_2, label: 'Árbitro 2 (3-Ref)', systemRole: RoleName.ARBITRO },
  { role: MatchRole.OFICIAL_1, label: 'Oficial de Mesa 1', systemRole: RoleName.OFICIAL_MESA },
  { role: MatchRole.OFICIAL_2, label: 'Oficial de Mesa 2', systemRole: RoleName.OFICIAL_MESA },
  { role: MatchRole.OFICIAL_3, label: 'Oficial de Mesa 3', systemRole: RoleName.OFICIAL_MESA },
];

export const AssignNominationModal: React.FC<AssignNominationModalProps> = ({
  isOpen,
  onClose,
  match,
  initialRole = MatchRole.ARBITRO_PRINCIPAL,
  onNominationCreated,
}) => {
  const [selectedRole, setSelectedRole] = useState<MatchRole>(initialRole);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [candidatesData, setCandidatesData] = useState<AvailableCandidatesResponse | null>(null);
  const [loadingCandidates, setLoadingCandidates] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Estado para forzar asignación excepcional (Override por escasez de personal)
  const [isOverride, setIsOverride] = useState<boolean>(false);
  const [overrideReason, setOverrideReason] = useState<string>('');
  const [showUnavailableList, setShowUnavailableList] = useState<boolean>(false);

  useEffect(() => {
    if (initialRole) {
      setSelectedRole(initialRole);
    }
  }, [initialRole]);

  // Cargar candidatos idóneos cada vez que cambie el partido o el rol seleccionado
  useEffect(() => {
    if (!isOpen || !match) return;

    let isMounted = true;
    const fetchCandidates = async () => {
      setLoadingCandidates(true);
      setError(null);
      setSelectedUserId('');
      setIsOverride(false);
      setOverrideReason('');

      try {
        const data = await nominationsApi.getAvailableCandidates(match.id, selectedRole);
        if (isMounted) {
          setCandidatesData(data);
          // Si hay candidatos disponibles, preseleccionar el primero
          if (data.availableCandidates.length > 0) {
            setSelectedUserId(data.availableCandidates[0].id);
          }
        }
      } catch (err: any) {
        if (isMounted) {
          setError(
            err.response?.data?.message || 'Error al consultar disponibilidad de candidatos.',
          );
        }
      } finally {
        if (isMounted) {
          setLoadingCandidates(false);
        }
      }
    };

    fetchCandidates();

    return () => {
      isMounted = false;
    };
  }, [isOpen, match, selectedRole]);

  if (!isOpen || !match) return null;

  // Determinar si el candidato seleccionado actualmente es "no disponible"
  const selectedCandidateIsUnavailable = candidatesData?.unavailableCandidates.some(
    (c) => c.id === selectedUserId,
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) {
      setError('Por favor selecciona un candidato para nominar.');
      return;
    }

    if (selectedCandidateIsUnavailable && (!isOverride || !overrideReason.trim())) {
      setError(
        'El candidato seleccionado no cumple con disponibilidad o tiene conflicto. Debes marcar la casilla de asignación forzada e ingresar un motivo justificado.',
      );
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await nominationsApi.createNomination({
        matchId: match.id,
        userId: selectedUserId,
        matchRole: selectedRole,
        overrideAvailability: isOverride,
        overrideReason: isOverride ? overrideReason.trim() : undefined,
      });

      setSuccessMessage('¡Nominación creada exitosamente y notificación despachada!');
      setTimeout(() => {
        onNominationCreated();
        onClose();
      }, 1000);
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          'Error al registrar la nominación. Verifica los datos y requisitos de rol.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const formattedDate = new Date(match.matchDateTime).toLocaleDateString('es-CL', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="assign-nomination-title"
    >
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Cabecera del Modal */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/40">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-950/40 border border-brand-200/60 dark:border-brand-800/60 flex items-center justify-center text-brand-700 dark:text-brand-300">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 id="assign-nomination-title" className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Designar Personal al Partido
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Asignación de árbitros y oficiales según disponibilidad horaria
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Ficha Resumen del Partido */}
        <div className="px-6 py-3.5 bg-slate-100/60 dark:bg-slate-950/60 border-b border-slate-200/80 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 flex flex-wrap gap-4 items-center justify-between">
          <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
            <span className="text-brand-600 dark:text-brand-400 font-bold">{match.homeTeam}</span>
            <span className="text-slate-400">vs</span>
            <span className="text-brand-600 dark:text-brand-400 font-bold">{match.awayTeam}</span>
            <span className="text-slate-400 font-normal">({match.tournament} - {match.category})</span>
          </div>
          <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              {formattedDate}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              Bloque: <strong className="text-slate-800 dark:text-slate-200">{match.timeBlock}</strong>
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              {match.venue}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Mensajes de Alerta */}
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-sm flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-rose-900 dark:text-rose-200">Validación de Asignación</p>
                <p className="text-xs text-rose-700 dark:text-rose-300 mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-sm flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* 1. Selector de Slot / Rol de Partido */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
              1. Seleccionar Puesto a Designar
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {ALL_ROLES.map((r) => {
                const isSelected = selectedRole === r.role;
                return (
                  <button
                    key={r.role}
                    type="button"
                    onClick={() => setSelectedRole(r.role)}
                    className={`flex flex-col items-start p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-brand-600 dark:border-brand-500 bg-brand-50/70 dark:bg-brand-950/40 ring-2 ring-brand-500/20 shadow-sm'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <MatchRoleBadge role={r.role} showIcon={false} />
                    <span className="text-caption text-slate-500 dark:text-slate-400 mt-1">
                      Requiere rol: <strong className="text-slate-700 dark:text-slate-300">{r.systemRole}</strong>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Lista de Candidatos y Cruce de Disponibilidad */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                2. Seleccionar Árbitro u Oficial Acreditado
              </label>
              {candidatesData && (
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  <strong className="text-emerald-700 dark:text-emerald-400">{candidatesData.counts.availableCount}</strong> disponibles de{' '}
                  {candidatesData.counts.totalActiveWithRole} acreditados
                </span>
              )}
            </div>

            {loadingCandidates ? (
              <div className="p-8 text-center bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-slate-200 dark:border-slate-800">
                <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Cruzando disponibilidad declarada, solapamiento de partidos y rol técnico...
                </p>
              </div>
            ) : !candidatesData || (candidatesData.availableCandidates.length === 0 && candidatesData.unavailableCandidates.length === 0) ? (
              <div className="p-6 text-center bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs">
                No hay usuarios registrados con el rol técnico requerido ({candidatesData?.requiredSystemRole || 'requerido'}).
              </div>
            ) : (
              <div className="space-y-3">
                {/* Lista de Candidatos Disponibles */}
                {candidatesData.availableCandidates.length > 0 ? (
                  <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 border border-slate-200 dark:border-slate-800 rounded-xl p-2 bg-slate-50/50 dark:bg-slate-950/40">
                    {candidatesData.availableCandidates.map((c) => {
                      const isChecked = selectedUserId === c.id;
                      return (
                        <label
                          key={c.id}
                          className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition-all ${
                            isChecked
                              ? 'bg-white dark:bg-slate-800/90 border-brand-500 dark:border-brand-400 shadow-xs ring-1 ring-brand-500'
                              : 'bg-white/80 dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="radio"
                              name="candidate"
                              value={c.id}
                              checked={isChecked}
                              onChange={() => {
                                setSelectedUserId(c.id);
                                setIsOverride(false);
                              }}
                              className="w-4 h-4 text-brand-600 focus:ring-brand-500 border-slate-300 dark:border-slate-700"
                            />
                            <div>
                              <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                                {c.firstName} {c.lastName}
                              </p>
                              <p className="text-caption text-slate-500 dark:text-slate-400">{c.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-caption font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                              <UserCheck className="w-3 h-3" />
                              Disponible ({c.declaredBlock})
                            </span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-4 bg-amber-50/80 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-300 text-xs flex items-start gap-2">
                    <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">No hay personal disponible para este bloque horario</p>
                      <p className="mt-0.5 text-amber-700 dark:text-amber-300">
                        Ningún usuario activo con rol <strong>{candidatesData.requiredSystemRole}</strong> declaró disponibilidad compatible ({match.timeBlock}) para esta fecha.
                      </p>
                    </div>
                  </div>
                )}

                {/* Sección Colapsable de Candidatos No Disponibles o con Conflicto */}
                {candidatesData.unavailableCandidates.length > 0 && (
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setShowUnavailableList(!showUnavailableList)}
                      className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1.5 cursor-pointer"
                    >
                      <UserX className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        {showUnavailableList ? 'Ocultar' : 'Ver'} personal no disponible o con conflicto (
                        {candidatesData.counts.unavailableCount})
                      </span>
                    </button>

                    {showUnavailableList && (
                      <div className="mt-2 max-h-40 overflow-y-auto space-y-1.5 border border-slate-200 dark:border-slate-800 rounded-xl p-2 bg-rose-50/20 dark:bg-rose-950/20">
                        {candidatesData.unavailableCandidates.map((c) => {
                          const isChecked = selectedUserId === c.id;
                          return (
                            <label
                              key={c.id}
                              className={`flex items-center justify-between p-2 rounded-lg border cursor-pointer transition-all ${
                                isChecked
                                  ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-400 dark:border-rose-700 ring-1 ring-rose-400'
                                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                              }`}
                            >
                              <div className="flex items-center gap-2.5">
                                <input
                                  type="radio"
                                  name="candidate"
                                  value={c.id}
                                  checked={isChecked}
                                  onChange={() => {
                                    setSelectedUserId(c.id);
                                    setIsOverride(true);
                                  }}
                                  className="w-4 h-4 text-rose-600 focus:ring-rose-500 border-slate-300 dark:border-slate-700"
                                />
                                <div>
                                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                                    {c.firstName} {c.lastName}
                                  </p>
                                  <p className="text-2xs text-rose-700 dark:text-rose-400 font-medium">
                                    {c.unavailableReason}
                                  </p>
                                </div>
                              </div>
                              <span className="text-2xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium">
                                Bloque: {c.declaredBlock}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 3. Panel de Forzado de Asignación (Override por escasez de personal) */}
          {selectedCandidateIsUnavailable && (
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 space-y-3">
              <div className="flex items-start gap-2">
                <input
                  id="override-checkbox"
                  type="checkbox"
                  checked={isOverride}
                  onChange={(e) => setIsOverride(e.target.checked)}
                  className="w-4 h-4 text-amber-600 focus:ring-amber-500 border-amber-400 rounded mt-0.5"
                />
                <label htmlFor="override-checkbox" className="text-xs font-bold text-amber-950 dark:text-amber-200 cursor-pointer">
                  Forzar designación excepcional (Habilitar asignación directa por necesidad operativa)
                </label>
              </div>
              <p className="text-caption text-amber-800 dark:text-amber-300 leading-relaxed">
                El candidato no declaró disponibilidad para este bloque horario o presenta conflicto de solapamiento. Como Administrador de Comisión Técnica puedes autorizar la designación asumiendo la coordinación operativa. Esta acción quedará registrada formalmente en el registro de auditoría.
              </p>
              {isOverride && (
                <div>
                  <label className="block text-caption font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wider mb-1">
                    Motivo o Justificación de la Designación Directa *
                  </label>
                  <textarea
                    rows={2}
                    value={overrideReason}
                    onChange={(e) => setOverrideReason(e.target.value)}
                    placeholder="Ej. Reemplazo de urgencia o consentimiento telefónico previo obtenido."
                    className="w-full px-3 py-2 text-xs border border-amber-300 dark:border-amber-700 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
                    required
                  />
                </div>
              )}
            </div>
          )}

          {/* Botones de Acción */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting || loadingCandidates || !selectedUserId}
              className="px-4 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              {submitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Asignar y Notificar</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};