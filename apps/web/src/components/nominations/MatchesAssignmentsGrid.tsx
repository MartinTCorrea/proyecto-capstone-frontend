import React from 'react';
import { MatchItem } from '../../api/matches.api';
import { NominationItem } from '../../api/nominations.api';
import { MatchRole, NominationStatus, RoleName } from '@sgaob/shared';
import { NominationStatusBadge } from './NominationStatusBadge';
import { MatchRoleBadge } from './MatchRoleBadge';
import {
  Calendar,
  MapPin,
  Clock,
  UserPlus,
  Trash2,
  CheckSquare,
  AlertCircle,
  Shield,
  Users,
} from 'lucide-react';

interface MatchesAssignmentsGridProps {
  matches: MatchItem[];
  nominations: NominationItem[];
  isLoading: boolean;
  onOpenAssignModal: (match: MatchItem, role: MatchRole) => void;
  onOpenRespondModal: (nomination: NominationItem) => void;
  onDeleteNomination: (id: string) => void;
  isAdmin: boolean;
  currentUserId?: string;
}

const REFEREE_SLOTS: { role: MatchRole; label: string }[] = [
  { role: MatchRole.ARBITRO_PRINCIPAL, label: 'Principal' },
  { role: MatchRole.ARBITRO_1, label: 'Árbitro 1' },
  { role: MatchRole.ARBITRO_2, label: 'Árbitro 2 (Opc.)' },
];

const TABLE_SLOTS: { role: MatchRole; label: string }[] = [
  { role: MatchRole.OFICIAL_1, label: 'Oficial 1' },
  { role: MatchRole.OFICIAL_2, label: 'Oficial 2' },
  { role: MatchRole.OFICIAL_3, label: 'Oficial 3' },
];

export const MatchesAssignmentsGrid: React.FC<MatchesAssignmentsGridProps> = ({
  matches,
  nominations,
  isLoading,
  onOpenAssignModal,
  onOpenRespondModal,
  onDeleteNomination,
  isAdmin,
  currentUserId,
}) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
        <div className="w-8 h-8 border-3 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm font-medium text-slate-500">Cargando cartelera de partidos y asignaciones...</p>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
        <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-3">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-bold text-slate-800">No hay partidos para los filtros seleccionados</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          Ajusta el rango de fechas o los filtros para visualizar la cartelera y sus ternas arbitrales.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {matches.map((match) => {
        // Encontrar todas las nominaciones de este partido
        const matchNoms = nominations.filter((n) => n.matchId === match.id);

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
            className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:border-slate-300 transition-all"
          >
            {/* Header del Partido */}
            <div className="px-5 py-3.5 bg-slate-50/80 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold text-slate-900 bg-white px-2.5 py-1 rounded-md border border-slate-200 shadow-2xs">
                  {match.tournament}
                </span>
                <span className="text-xs text-slate-500 font-medium">&bull; {match.category}</span>
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-600">
                <span className="flex items-center gap-1 font-semibold text-slate-800">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  {formattedDate}
                </span>
                <span className="flex items-center gap-1 text-slate-500">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  Bloque: <strong>{match.timeBlock}</strong>
                </span>
                <span className="flex items-center gap-1 text-slate-500">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {match.venue}
                </span>
              </div>
            </div>

            {/* Cuerpo del Partido y Asignación de Slots */}
            <div className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              {/* Columna Equipos */}
              <div className="lg:col-span-3 space-y-1">
                <div className="text-sm font-bold text-slate-900">
                  <p className="text-brand-600 font-extrabold">{match.homeTeam}</p>
                  <p className="text-slate-400 font-normal text-xs my-0.5">vs</p>
                  <p className="text-brand-600 font-extrabold">{match.awayTeam}</p>
                </div>
              </div>

              {/* Columna Terna Arbitral */}
              <div className="lg:col-span-5 border-t lg:border-t-0 lg:border-l border-slate-100 lg:pl-6 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700">
                  <Shield className="w-4 h-4 text-brand-600" />
                  <span>Terna Arbitral (RF13, Anexo A.1, A.2)</span>
                </div>
                <div className="space-y-1.5">
                  {REFEREE_SLOTS.map((slot) => {
                    const nom = matchNoms.find((n) => n.matchRole === slot.role);
                    const canRespond = nom && (isAdmin || (currentUserId && nom.userId === currentUserId));

                    return (
                      <div
                        key={slot.role}
                        className="flex items-center justify-between p-2 rounded-lg bg-slate-50/70 border border-slate-200/70 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <MatchRoleBadge role={slot.role} showIcon={false} />
                          {nom?.user ? (
                            <span className="font-semibold text-slate-900">
                              {nom.user.firstName} {nom.user.lastName}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">Sin designar</span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {nom ? (
                            <>
                              <NominationStatusBadge status={nom.status} />
                              {canRespond && (
                                <button
                                  type="button"
                                  onClick={() => onOpenRespondModal(nom)}
                                  className="p-1 text-slate-500 hover:text-brand-600 hover:bg-white rounded transition-colors"
                                  title="Responder nominación"
                                >
                                  <CheckSquare className="w-3.5 h-3.5" />
                                </button>
                              )}
                              {isAdmin && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (window.confirm('¿Revocar esta asignación arbitral?')) {
                                      onDeleteNomination(nom.id);
                                    }
                                  }}
                                  className="p-1 text-slate-400 hover:text-rose-600 hover:bg-white rounded transition-colors"
                                  title="Revocar asignación"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </>
                          ) : (
                            isAdmin && (
                              <button
                                type="button"
                                onClick={() => onOpenAssignModal(match, slot.role)}
                                className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold text-brand-700 bg-white hover:bg-brand-50 rounded border border-brand-200 transition-colors shadow-2xs"
                              >
                                <UserPlus className="w-3 h-3" />
                                <span>Asignar</span>
                              </button>
                            )
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Columna Oficiales de Mesa */}
              <div className="lg:col-span-4 border-t lg:border-t-0 lg:border-l border-slate-100 lg:pl-6 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700">
                  <Users className="w-4 h-4 text-purple-600" />
                  <span>Oficiales de Mesa (OMC)</span>
                </div>
                <div className="space-y-1.5">
                  {TABLE_SLOTS.map((slot) => {
                    const nom = matchNoms.find((n) => n.matchRole === slot.role);
                    const canRespond = nom && (isAdmin || (currentUserId && nom.userId === currentUserId));

                    return (
                      <div
                        key={slot.role}
                        className="flex items-center justify-between p-2 rounded-lg bg-slate-50/70 border border-slate-200/70 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <MatchRoleBadge role={slot.role} showIcon={false} />
                          {nom?.user ? (
                            <span className="font-semibold text-slate-900">
                              {nom.user.firstName} {nom.user.lastName}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">Sin designar</span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {nom ? (
                            <>
                              <NominationStatusBadge status={nom.status} />
                              {canRespond && (
                                <button
                                  type="button"
                                  onClick={() => onOpenRespondModal(nom)}
                                  className="p-1 text-slate-500 hover:text-brand-600 hover:bg-white rounded transition-colors"
                                  title="Responder nominación"
                                >
                                  <CheckSquare className="w-3.5 h-3.5" />
                                </button>
                              )}
                              {isAdmin && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (window.confirm('¿Revocar esta asignación de mesa?')) {
                                      onDeleteNomination(nom.id);
                                    }
                                  }}
                                  className="p-1 text-slate-400 hover:text-rose-600 hover:bg-white rounded transition-colors"
                                  title="Revocar asignación"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </>
                          ) : (
                            isAdmin && (
                              <button
                                type="button"
                                onClick={() => onOpenAssignModal(match, slot.role)}
                                className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold text-purple-700 bg-white hover:bg-purple-50 rounded border border-purple-200 transition-colors shadow-2xs"
                              >
                                <UserPlus className="w-3 h-3" />
                                <span>Asignar</span>
                              </button>
                            )
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
