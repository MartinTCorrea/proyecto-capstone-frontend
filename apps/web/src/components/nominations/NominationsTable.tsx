import React from 'react';
import { NominationItem } from '../../api/nominations.api';
import { NominationStatusBadge } from './NominationStatusBadge';
import { MatchRoleBadge } from './MatchRoleBadge';
import {
  Calendar,
  MapPin,
  Trash2,
  CheckSquare,
  MessageSquareQuote,
  AlertCircle,
} from 'lucide-react';

interface NominationsTableProps {
  nominations: NominationItem[];
  isLoading: boolean;
  onOpenRespondModal: (nomination: NominationItem) => void;
  onDeleteNomination: (id: string) => void;
  isAdmin: boolean;
  currentUserId?: string;
}

export const NominationsTable: React.FC<NominationsTableProps> = ({
  nominations,
  isLoading,
  onOpenRespondModal,
  onDeleteNomination,
  isAdmin,
  currentUserId,
}) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
        <div className="w-8 h-8 border-3 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm font-medium text-slate-500">Cargando asignaciones y partidos...</p>
      </div>
    );
  }

  if (nominations.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
        <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-3">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-bold text-slate-800">No se encontraron asignaciones</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          No hay registros de nominaciones que coincidan con los filtros seleccionados o la fecha consultada.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
              <th className="py-3 px-4">Fecha y Partido</th>
              <th className="py-3 px-4">Torneo & Recinto</th>
              <th className="py-3 px-4">Rol Asignado</th>
              <th className="py-3 px-4">Personal Designado</th>
              <th className="py-3 px-4 text-center">Estado</th>
              <th className="py-3 px-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {nominations.map((nom) => {
              const match = nom.match;
              const formattedDate = match
                ? new Date(match.matchDateTime).toLocaleDateString('es-CL', {
                    day: '2-digit',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : 'Sin fecha';

              const canRespond = isAdmin || (currentUserId && nom.userId === currentUserId);

              return (
                <tr key={nom.id} className="hover:bg-slate-50/80 transition-colors">
                  {/* Fecha y Partido */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1.5 text-slate-500 text-[11px] mb-0.5">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      <span>{formattedDate}</span>
                    </div>
                    {match ? (
                      <div className="font-bold text-slate-900 text-xs">
                        <span>{match.homeTeam}</span>
                        <span className="text-slate-400 font-normal mx-1">vs</span>
                        <span>{match.awayTeam}</span>
                      </div>
                    ) : (
                      <span className="text-slate-400">Partido #{nom.matchId.slice(0, 8)}</span>
                    )}
                  </td>

                  {/* Torneo & Recinto */}
                  <td className="py-3.5 px-4 text-slate-600">
                    <p className="font-semibold text-slate-800 line-clamp-1">
                      {match?.tournament || 'N/A'}
                    </p>
                    <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                      <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0" />
                      <span className="line-clamp-1">{match?.venue || 'N/A'}</span>
                    </div>
                  </td>

                  {/* Rol Asignado */}
                  <td className="py-3.5 px-4">
                    <MatchRoleBadge role={nom.matchRole} />
                  </td>

                  {/* Personal Designado */}
                  <td className="py-3.5 px-4">
                    {nom.user ? (
                      <div>
                        <p className="font-bold text-slate-900">
                          {nom.user.firstName} {nom.user.lastName}
                        </p>
                        <p className="text-[11px] text-slate-500">{nom.user.email}</p>
                      </div>
                    ) : (
                      <span className="text-slate-400">Usuario #{nom.userId.slice(0, 8)}</span>
                    )}
                  </td>

                  {/* Estado e Información de Rechazo */}
                  <td className="py-3.5 px-4 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <NominationStatusBadge status={nom.status} />
                      {nom.rejectionReason && (
                        <div
                          className="flex items-center gap-1 text-[11px] text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200/60 max-w-xs text-left"
                          title={nom.rejectionReason}
                        >
                          <MessageSquareQuote className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{nom.rejectionReason}</span>
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Acciones */}
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {canRespond && (
                        <button
                          type="button"
                          onClick={() => onOpenRespondModal(nom)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 rounded-lg border border-brand-200 transition-colors"
                          title="Confirmar o Rechazar Designación"
                        >
                          <CheckSquare className="w-3.5 h-3.5" />
                          <span>Responder</span>
                        </button>
                      )}

                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => {
                            if (
                              window.confirm(
                                '¿Estás seguro de que deseas revocar esta asignación? El slot quedará libre para designar a otra persona.',
                              )
                            ) {
                              onDeleteNomination(nom.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Revocar asignación (Comisión Técnica)"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
