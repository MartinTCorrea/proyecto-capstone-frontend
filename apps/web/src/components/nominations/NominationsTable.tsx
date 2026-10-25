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
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-12 text-center transition-colors duration-200">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Cargando asignaciones y partidos...</p>
      </div>
    );
  }

  if (nominations.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-12 text-center transition-colors duration-200">
        <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 mx-auto mb-3">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">No se encontraron asignaciones</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
          No hay registros de nominaciones que coincidan con los filtros seleccionados o la fecha consultada.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors duration-200">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-caption">
              <th className="py-3 px-4">Fecha y Partido</th>
              <th className="py-3 px-4">Torneo & Recinto</th>
              <th className="py-3 px-4">Rol Asignado</th>
              <th className="py-3 px-4">Personal Designado</th>
              <th className="py-3 px-4 text-center">Estado</th>
              <th className="py-3 px-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-slate-900">
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
                <tr key={nom.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                  {/* Fecha y Partido */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-caption mb-0.5">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      <span>{formattedDate}</span>
                    </div>
                    {match ? (
                      <div className="font-bold text-slate-900 dark:text-white text-xs">
                        <span>{match.homeTeam}</span>
                        <span className="text-slate-400 font-normal mx-1">vs</span>
                        <span>{match.awayTeam}</span>
                      </div>
                    ) : (
                      <span className="text-slate-400">Partido #{nom.matchId.slice(0, 8)}</span>
                    )}
                  </td>

                  {/* Torneo & Recinto */}
                  <td className="py-3.5 px-4">
                    {match ? (
                      <div>
                        <span className="font-semibold text-slate-700 dark:text-slate-300 block">
                          {match.tournament} • {match.category}
                        </span>
                        <div className="flex items-center gap-1 text-caption text-slate-500 dark:text-slate-400 mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span className="truncate max-w-[180px]">{match.venue}</span>
                        </div>
                      </div>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>

                  {/* Rol */}
                  <td className="py-3.5 px-4">
                    <MatchRoleBadge role={nom.matchRole} />
                  </td>

                  {/* Personal Designado */}
                  <td className="py-3.5 px-4">
                    {nom.user ? (
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white block">
                          {nom.user.firstName} {nom.user.lastName}
                        </span>
                        <span className="text-slate-400 dark:text-slate-500 font-mono text-2xs">
                          {nom.user.email}
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-400">Usuario #{nom.userId.slice(0, 8)}</span>
                    )}
                  </td>

                  {/* Estado y Motivo */}
                  <td className="py-3.5 px-4 text-center">
                    <div className="inline-flex flex-col items-center">
                      <NominationStatusBadge status={nom.status} />
                      {nom.rejectionReason && (
                        <div
                          className="mt-1 flex items-center gap-1 text-2xs text-rose-600 dark:text-rose-400 max-w-[140px] truncate"
                          title={`Motivo de rechazo: ${nom.rejectionReason}`}
                        >
                          <MessageSquareQuote className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{nom.rejectionReason}</span>
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Acciones */}
                  <td className="py-3.5 px-4 text-right">
                    <div className="inline-flex items-center gap-1.5 justify-end">
                      {canRespond && (
                        <button
                          type="button"
                          onClick={() => onOpenRespondModal(nom)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-slate-800 border border-blue-200 dark:border-blue-900/40 rounded-lg hover:bg-blue-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                          title="Confirmar o rechazar designación"
                        >
                          <CheckSquare className="w-3.5 h-3.5" />
                          <span>Responder...</span>
                        </button>
                      )}

                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => onDeleteNomination(nom.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                          title="Eliminar designación"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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

export default NominationsTable;
