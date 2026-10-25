import React, { useState, useEffect, useCallback } from 'react';
import { AvailabilityBlock, RoleName } from '@sgaob/shared';
import { availabilityApi, AvailabilitySummaryResponse } from '../../api/availability.api';
import { Users, Calendar, Filter, Phone, Mail, RefreshCw, Sun, Moon, CheckCircle } from 'lucide-react';
import { LoadingSpinner } from '../common/LoadingSpinner';

export const AvailabilitySummaryView: React.FC = () => {
  // Por defecto fecha de hoy en formato YYYY-MM-DD
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

  const [selectedRole, setSelectedRole] = useState<RoleName | ''>('');
  const [selectedBlock, setSelectedBlock] = useState<AvailabilityBlock | ''>('');
  const [isLoading, setIsLoading] = useState(false);
  const [summaryData, setSummaryData] = useState<AvailabilitySummaryResponse | null>(null);

  const fetchSummary = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await availabilityApi.getAvailabilitySummary({
        date: selectedDate,
        role: selectedRole || undefined,
        block: selectedBlock || undefined,
      });
      setSummaryData(data);
    } catch (err) {
      console.error('Error al consultar consolidado de disponibilidad:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedDate, selectedRole, selectedBlock]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return (
    <div className="space-y-6">
      {/* Controles de Consulta y Filtros */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-colors duration-200">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <span>Consolidado General de Disponibilidad</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Consulta el padrón de árbitros y oficiales de mesa disponibles para designaciones.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Selector de Fecha */}
          <div className="flex items-center space-x-2">
            <label htmlFor="summary-date" className="text-xs font-semibold text-slate-600 dark:text-slate-400 flex items-center">
              <Calendar className="w-4 h-4 mr-1 text-slate-400" />
              <span>Fecha:</span>
            </label>
            <input
              id="summary-date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-purple-500 focus:outline-none"
            />
          </div>

          {/* Filtro por Rol */}
          <div className="flex items-center space-x-2">
            <Filter className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as RoleName | '')}
              className="text-xs border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-purple-500 focus:outline-none"
            >
              <option value="">Todos los Roles</option>
              <option value={RoleName.ARBITRO}>Árbitros</option>
              <option value={RoleName.OFICIAL_MESA}>Oficiales de Mesa</option>
            </select>
          </div>

          {/* Filtro por Bloque */}
          <select
            value={selectedBlock}
            onChange={(e) => setSelectedBlock(e.target.value as AvailabilityBlock | '')}
            className="text-xs border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-purple-500 focus:outline-none"
          >
            <option value="">Todos los Bloques</option>
            <option value={AvailabilityBlock.HORARIO_1}>Horario 1</option>
            <option value={AvailabilityBlock.HORARIO_2}>Horario 2</option>
            <option value={AvailabilityBlock.FULL}>Full Day</option>
            <option value={AvailabilityBlock.NO}>No Disponible</option>
          </select>

          <button
            onClick={() => fetchSummary()}
            title="Refrescar consolidado"
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Tarjetas de Resumen por Bloque */}
      {summaryData && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between transition-colors duration-200">
            <div>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Horario 1</span>
              <p className="text-2xl font-extrabold text-blue-700 dark:text-blue-400 mt-0.5">
                {summaryData.counts.HORARIO_1}
              </p>
            </div>
            <Sun className="w-8 h-8 text-blue-300 dark:text-blue-600/50" />
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between transition-colors duration-200">
            <div>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Horario 2</span>
              <p className="text-2xl font-extrabold text-amber-700 dark:text-amber-400 mt-0.5">
                {summaryData.counts.HORARIO_2}
              </p>
            </div>
            <Moon className="w-8 h-8 text-amber-300 dark:text-amber-600/50" />
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between transition-colors duration-200">
            <div>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Full Day</span>
              <p className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-400 mt-0.5">
                {summaryData.counts.FULL}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-emerald-300 dark:text-emerald-600/50" />
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between transition-colors duration-200">
            <div>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">No Disponibles</span>
              <p className="text-2xl font-extrabold text-slate-600 dark:text-slate-300 mt-0.5">
                {summaryData.counts.NO}
              </p>
            </div>
            <Users className="w-8 h-8 text-slate-300 dark:text-slate-600" />
          </div>
        </div>
      )}

      {/* Tabla de Personal Disponible */}
      {isLoading ? (
        <div className="bg-white dark:bg-slate-900 p-12 rounded-xl border border-slate-200 dark:border-slate-800 transition-colors duration-200">
          <LoadingSpinner message="Consultando personal disponible..." size="lg" />
        </div>
      ) : summaryData && summaryData.personnel.length > 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors duration-200">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider text-caption border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-3.5">Árbitro / Oficial de Mesa</th>
                <th className="px-6 py-3.5">Acreditaciones</th>
                <th className="px-6 py-3.5">Disponibilidad Declarada</th>
                <th className="px-6 py-3.5">Contacto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-slate-900">
              {summaryData.personnel.map((person) => (
                <tr key={person.availabilityId} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="px-6 py-3.5 font-bold text-slate-900 dark:text-white">
                    {person.fullName}
                  </td>
                  <td className="px-6 py-3.5">
                    <div className="flex flex-wrap gap-1">
                      {person.roles.map((r) => (
                        <span
                          key={r}
                          className={`text-2xs font-bold px-2 py-0.5 rounded-full border ${
                            r === RoleName.ARBITRO
                              ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-slate-800 dark:text-blue-300 dark:border-blue-900/40'
                              : r === RoleName.OFICIAL_MESA
                              ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-slate-800 dark:text-amber-300 dark:border-amber-900/40'
                              : 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-slate-800 dark:text-purple-300 dark:border-purple-900/40'
                          }`}
                        >
                          {r === RoleName.ARBITRO ? 'Árbitro' : r === RoleName.OFICIAL_MESA ? 'Oficial Mesa' : 'Comisión'}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-3.5">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-2xs font-bold ${
                        person.block === AvailabilityBlock.HORARIO_1
                          ? 'bg-blue-100 dark:bg-slate-800 text-blue-800 dark:text-blue-300 border dark:border-blue-900/40'
                          : person.block === AvailabilityBlock.HORARIO_2
                          ? 'bg-amber-100 dark:bg-slate-800 text-amber-800 dark:text-amber-300 border dark:border-amber-900/40'
                          : person.block === AvailabilityBlock.FULL
                          ? 'bg-emerald-100 dark:bg-slate-800 text-emerald-800 dark:text-emerald-300 border dark:border-emerald-900/40'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400 border dark:border-slate-700'
                      }`}
                    >
                      {person.block === AvailabilityBlock.HORARIO_1 && 'Horario 1'}
                      {person.block === AvailabilityBlock.HORARIO_2 && 'Horario 2'}
                      {person.block === AvailabilityBlock.FULL && 'Jornada Completa'}
                      {person.block === AvailabilityBlock.NO && 'No Disponible'}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-slate-500 dark:text-slate-400 font-mono text-caption">
                    <div className="flex flex-col space-y-0.5">
                      <span className="flex items-center">
                        <Mail className="w-3 h-3 mr-1 text-slate-400" />
                        {person.email}
                      </span>
                      {person.phone && (
                        <span className="flex items-center">
                          <Phone className="w-3 h-3 mr-1 text-slate-400" />
                          {person.phone}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 p-12 rounded-xl border border-slate-200 dark:border-slate-800 text-center transition-colors duration-200">
          <Calendar className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">No hay disponibilidad declarada</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Ningún árbitro u oficial de mesa ha registrado disponibilidad para la fecha seleccionada ({selectedDate}).
          </p>
        </div>
      )}
    </div>
  );
};

export default AvailabilitySummaryView;
