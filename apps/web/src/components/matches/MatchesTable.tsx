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
          <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-sky-50 text-sky-700 border border-sky-200">
            Horario 1
          </span>
        );
      case 'HORARIO_2':
        return (
          <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            Horario 2
          </span>
        );
      case 'AMBOS':
        return (
          <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            Ambos Bloques
          </span>
        );
      default:
        return null;
    }
  };

  if (matches.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm">
        <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
          <Trophy className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-800">No se encontraron partidos</h3>
        <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
          No hay encuentros registrados que coincidan con los filtros aplicados. Puedes sincronizar la cartelera o registrar un partido de forma manual.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[11px] tracking-wider">
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
                  Acciones
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {matches.map((match) => {
              const { dateStr, timeStr } = formatDateTime(match.matchDateTime);
              const nominationsCount = match.nominations ? match.nominations.length : 0;

              return (
                <tr key={match.id} className="hover:bg-slate-50/80 transition-colors">
                  {/* Fecha y Bloque */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <div className="flex items-center space-x-1.5 font-bold text-slate-900">
                        <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span className="capitalize">{dateStr}</span>
                        <span className="text-slate-400 font-normal">|</span>
                        <span>{timeStr} hrs</span>
                      </div>
                      <div className="mt-1">{getBlockBadge(match.timeBlock)}</div>
                    </div>
                  </td>

                  {/* Torneo y Categoría */}
                  <td className="px-6 py-4">
                    <div className="flex flex-col max-w-xs">
                      <span className="font-bold text-slate-800 line-clamp-1" title={match.tournament}>
                        {match.tournament}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">{match.category}</span>
                    </div>
                  </td>

                  {/* Encuentro */}
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-extrabold text-blue-900 text-sm">{match.homeTeam}</span>
                      <span className="text-xs text-slate-400 font-bold uppercase">vs</span>
                      <span className="font-extrabold text-indigo-900 text-sm">{match.awayTeam}</span>
                    </div>
                  </td>

                  {/* Recinto */}
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-1.5 text-slate-700 max-w-xs">
                      <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      <span className="text-xs font-medium line-clamp-2" title={match.venue}>
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
                    <div className="flex flex-col space-y-1">
                      <MatchPlatformBadge platform={match.platform} />
                      {nominationsCount > 0 && (
                        <span className="inline-flex items-center text-[10px] text-slate-500 font-medium">
                          <Users className="w-3 h-3 mr-1 text-slate-400" />
                          {nominationsCount} asignado(s)
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Acciones para Comisión Técnica */}
                  {isCT && (
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Link
                          to="/nominaciones"
                          className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                          title="Gestionar designaciones arbitrales"
                          aria-label={`Gestionar designaciones para ${match.homeTeam} vs ${match.awayTeam}`}
                        >
                          <UserPlus className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => onEditMatch(match)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Modificar partido / Actualizar estado"
                          aria-label={`Modificar partido ${match.homeTeam} vs ${match.awayTeam}`}
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        {match.platform === MatchPlatform.MANUAL && (
                          <button
                            onClick={() => onDeleteMatch(match)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Eliminar partido manual"
                            aria-label={`Eliminar partido ${match.homeTeam} vs ${match.awayTeam}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
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
