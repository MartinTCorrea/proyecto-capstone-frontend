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
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
            <Users className="w-5 h-5 text-purple-600" />
            <span>Consolidado de Disponibilidad (Comisión Técnica RF06)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Consulta el padrón de árbitros y oficiales de mesa disponibles para designaciones.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Selector de Fecha */}
          <div className="flex items-center space-x-2">
            <label htmlFor="summary-date" className="text-xs font-semibold text-slate-600 flex items-center">
              <Calendar className="w-4 h-4 mr-1 text-slate-400" />
              <span>Fecha:</span>
            </label>
            <input
              id="summary-date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-purple-500 focus:outline-none"
            />
          </div>

          {/* Filtro por Rol */}
          <div className="flex items-center space-x-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as RoleName | '')}
              className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 focus:ring-2 focus:ring-purple-500 focus:outline-none"
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
            className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 focus:ring-2 focus:ring-purple-500 focus:outline-none"
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
            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Tarjetas de Resumen por Bloque */}
      {summaryData && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500">Horario 1</span>
              <p className="text-2xl font-extrabold text-blue-700 mt-0.5">
                {summaryData.counts.HORARIO_1}
              </p>
            </div>
            <Sun className="w-8 h-8 text-blue-300" />
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500">Horario 2</span>
              <p className="text-2xl font-extrabold text-amber-700 mt-0.5">
                {summaryData.counts.HORARIO_2}
              </p>
            </div>
            <Moon className="w-8 h-8 text-amber-300" />
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500">Full Day</span>
              <p className="text-2xl font-extrabold text-emerald-700 mt-0.5">
                {summaryData.counts.FULL}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-emerald-300" />
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500">No Disponibles</span>
              <p className="text-2xl font-extrabold text-slate-600 mt-0.5">
                {summaryData.counts.NO}
              </p>
            </div>
            <Users className="w-8 h-8 text-slate-300" />
          </div>
        </div>
      )}

      {/* Tabla de Personal Disponible */}
      {isLoading ? (
        <div className="bg-white p-12 rounded-xl border border-slate-200">
          <LoadingSpinner message="Consultando personal disponible..." size="lg" />
        </div>
      ) : summaryData && summaryData.personnel.length > 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-6 py-3.5">Árbitro / Oficial de Mesa</th>
                <th className="px-6 py-3.5">Acreditaciones</th>
                <th className="px-6 py-3.5">Disponibilidad Declarada</th>
                <th className="px-6 py-3.5">Contacto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {summaryData.personnel.map((person) => (
                <tr key={person.availabilityId} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-3.5 font-bold text-slate-900">
                    {person.fullName}
                  </td>
                  <td className="px-6 py-3.5">
                    <div className="flex flex-wrap gap-1">
                      {person.roles.map((r) => (
                        <span
                          key={r}
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            r === RoleName.ARBITRO
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : r === RoleName.OFICIAL_MESA
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-purple-50 text-purple-700 border-purple-200'
                          }`}
                        >
                          {r === RoleName.ARBITRO ? 'Árbitro' : r === RoleName.OFICIAL_MESA ? 'Oficial Mesa' : 'Comisión'}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-3.5">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        person.block === AvailabilityBlock.HORARIO_1
                          ? 'bg-blue-100 text-blue-800'
                          : person.block === AvailabilityBlock.HORARIO_2
                          ? 'bg-amber-100 text-amber-800'
                          : person.block === AvailabilityBlock.FULL
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {person.block === AvailabilityBlock.HORARIO_1 && 'Horario 1'}
                      {person.block === AvailabilityBlock.HORARIO_2 && 'Horario 2'}
                      {person.block === AvailabilityBlock.FULL && 'Jornada Completa'}
                      {person.block === AvailabilityBlock.NO && 'No Disponible'}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-slate-500 font-mono text-[11px]">
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
        <div className="bg-white p-12 rounded-xl border border-slate-200 text-center">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No hay disponibilidad declarada</h3>
          <p className="text-xs text-slate-500 mt-1">
            Ningún árbitro u oficial de mesa ha registrado disponibilidad para la fecha seleccionada ({selectedDate}).
          </p>
        </div>
      )}
    </div>
  );
};

export default AvailabilitySummaryView;
