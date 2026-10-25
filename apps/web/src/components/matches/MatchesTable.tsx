import React from 'react';
import { Link } from 'react-router-dom';
import { MatchItem } from '../../api/matches.api';
import { MatchStatusBadge } from './MatchStatusBadge';
import { MatchPlatformBadge } from './MatchPlatformBadge';
import { RoleName, MatchPlatform } from '@sgaob/shared';
import { Calendar, MapPin, Trophy, Edit, Trash2, Users, UserPlus } from 'lucide-react';

interface MatchesTableProps {
  matches: MatchItem[];
  userRoles: RoleName[];
  onEditMatch: (match: MatchItem) => void;
  onDeleteMatch: (match: MatchItem) => void;
}

export const MatchesTable: React.FC<MatchesTableProps> = ({
  matches,
  userRoles,
  onEditMatch,
  onDeleteMatch,
}) => {
  const isCT = userRoles.includes(RoleName.ADMIN_COMISION_TECNICA);

  const formatDateTime = (isoDate: string) => {
    const d = new Date(isoDate);
    const dateStr = d.toLocaleDateString('es-CL', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
    const timeStr = d.toLocaleTimeString('es-CL', {
      hour: '2-digit',
      minute: '2-digit',
    });
    return { dateStr, timeStr };
  };

  const getBlockBadge = (block: string) => {
    switch (block) {
      case 'HORARIO_1':
        return (
          <span className="inline-block px-2 py-0.5 rounded text-caption font-semibold bg-sky-50 dark:bg-slate-800 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-900/40">
            Horario 1
          </span>
        );
      case 'HORARIO_2':
        return (
          <span className="inline-block px-2 py-0.5 rounded text-caption font-semibold bg-indigo-50 dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900/40">
            Horario 2
          </span>
        );
      case 'AMBOS':
        return (
          <span className="inline-block px-2 py-0.5 rounded text-caption font-semibold bg-purple-50 dark:bg-slate-800 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-900/40">
            Ambos Bloques
          </span>
        );
      default:
        return null;
    }
  };

  if (matches.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center shadow-sm transition-colors duration-200">
        <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400 border dark:border-blue-900/40 flex items-center justify-center mx-auto mb-3">
          <Trophy className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">No se encontraron partidos</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
          No hay encuentros registrados que coincidan con los filtros aplicados. Puedes sincronizar la cartelera o registrar un partido de forma manual.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors duration-200">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-left text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 font-bold uppercase text-caption tracking-wider border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th scope="col" className="px-6 py-3.5">
                Fecha / Horario
              </th>
              <th scope="col" className="px-6 py-3.5">
                Torneo & Categoría
              </th>
              <th scope="col" className="px-6 py-3.5">
                Encuentro (Local vs Visita)
              </th>
              <th scope="col" className="px-6 py-3.5">
                Gimnasio / Recinto
              </th>
              <th scope="col" className="px-6 py-3.5">
                Estado
              </th>
              <th scope="col" className="px-6 py-3.5">
                Origen
              </th>
              {isCT && (
                <th scope="col" className="px-6 py-3.5 text-right">
                  Acciones CT
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-slate-900">
            {matches.map((match) => {
              const { dateStr, timeStr } = formatDateTime(match.matchDateTime);
              const nominationsCount = match.nominations?.length || 0;

              return (
                <tr key={match.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                  {/* Fecha y Bloque */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white capitalize">{dateStr}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">{timeStr} hrs</div>
                      </div>
                    </div>
                    {match.timeBlock && <div className="mt-1">{getBlockBadge(match.timeBlock)}</div>}
                  </td>

                  {/* Torneo y Categoría */}
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-900 dark:text-white leading-tight">{match.tournament}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">{match.category}</div>
                  </td>

                  {/* Encuentro */}
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                      <span>{match.homeTeam}</span>
                      <span className="text-xs text-slate-400 font-semibold">vs</span>
                      <span>{match.awayTeam}</span>
                    </div>
                    {isCT && (
                      <div className="mt-1 flex items-center text-caption text-slate-500 dark:text-slate-400">
                        <Users className="w-3.5 h-3.5 mr-1 text-slate-400" />
                        <span>{nominationsCount} asignado(s)</span>
                      </div>
                    )}
                  </td>

                  {/* Recinto */}
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-1.5 text-slate-700 dark:text-slate-300">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span className="truncate max-w-[200px]" title={match.venue}>
                        {match.venue}
                      </span>
                    </div>
                  </td>

                  {/* Estado */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <MatchStatusBadge status={match.status} />
                  </td>

                  {/* Origen */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <MatchPlatformBadge platform={match.platform} />
                  </td>

                  {/* Acciones para Comisión Técnica */}
                  {isCT && (
                    <td className="px-6 py-4 whitespace-nowrap text-right space-x-1.5">
                      <Link
                        to="/nominaciones"
                        className="inline-flex items-center p-1.5 rounded-lg border border-purple-200 dark:border-purple-900/40 bg-purple-50 dark:bg-slate-800 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-slate-700 transition-colors"
                        title="Gestionar designaciones del partido"
                      >
                        <UserPlus className="w-4 h-4" />
                      </Link>

                      <button
                        onClick={() => onEditMatch(match)}
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                        title="Reprogramar o cambiar estado del partido"
                      >
                        <Edit className="w-4 h-4" />
                      </button>

                      {match.platform === MatchPlatform.MANUAL && (
                        <button
                          onClick={() => onDeleteMatch(match)}
                          className="p-1.5 rounded-lg border border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                          title="Eliminar partido manual"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MatchesTable;