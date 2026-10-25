import React from 'react';
import { AvailabilityBlock, DayType, TimeBlockCode, TimeBlockConfigDto } from '@sgaob/shared';
import { Sun, Moon, Check, X, Calendar, Clock } from 'lucide-react';

export interface DayAvailabilityState {
  date: string; // YYYY-MM-DD
  dayName: string;
  formattedDate: string;
  dayType: DayType;
  selectedBlock: AvailabilityBlock;
}

interface WeeklyCalendarGridProps {
  days: DayAvailabilityState[];
  timeBlocks: TimeBlockConfigDto[];
  isReadOnly: boolean;
  onBlockChange: (date: string, block: AvailabilityBlock) => void;
}

export const WeeklyCalendarGrid: React.FC<WeeklyCalendarGridProps> = ({
  days,
  timeBlocks,
  isReadOnly,
  onBlockChange,
}) => {
  // Encuentra la configuración horaria específica para un tipo de día y bloque
  const getBlockTimes = (dayType: DayType, code: TimeBlockCode) => {
    const config = timeBlocks.find(
      (b) => b.dayType === dayType && b.blockCode === code,
    );
    if (!config) return code === TimeBlockCode.HORARIO_1 ? 'H1' : 'H2';
    return `${config.startTime} - ${config.endTime}`;
  };

  // Obtiene el rango horario continuo para jornada completa (inicio H1 - término H2)
  const getFullDayTime = (dayType: DayType) => {
    const h1 = timeBlocks.find((b) => b.dayType === dayType && b.blockCode === TimeBlockCode.HORARIO_1);
    const h2 = timeBlocks.find((b) => b.dayType === dayType && b.blockCode === TimeBlockCode.HORARIO_2);
    if (h1 && h2) {
      return `${h1.startTime} - ${h2.endTime}`;
    }
    return dayType === DayType.LABORAL ? '15:30 - 22:00' : '09:00 - 22:00';
  };

  const weekdayDays = days.filter((d) => d.dayType === DayType.LABORAL);
  const weekendDays = days.filter((d) => d.dayType === DayType.FIN_DE_SEMANA);

  const weekdayH1 = getBlockTimes(DayType.LABORAL, TimeBlockCode.HORARIO_1);
  const weekdayH2 = getBlockTimes(DayType.LABORAL, TimeBlockCode.HORARIO_2);
  const weekdayFull = getFullDayTime(DayType.LABORAL);

  const weekendH1 = getBlockTimes(DayType.FIN_DE_SEMANA, TimeBlockCode.HORARIO_1);
  const weekendH2 = getBlockTimes(DayType.FIN_DE_SEMANA, TimeBlockCode.HORARIO_2);
  const weekendFull = getFullDayTime(DayType.FIN_DE_SEMANA);

  // Renderizador de una fila individual de día
  const renderDayRow = (
    day: DayAvailabilityState,
    h1Time: string,
    h2Time: string,
    fullTime: string,
  ) => {
    return (
      <div
        key={day.date}
        className="p-3.5 sm:p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
      >
        {/* Identificación del Día */}
        <div className="flex items-center space-x-3 lg:w-44 flex-shrink-0">
          <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-bold text-xs text-slate-700 dark:text-slate-300 flex-shrink-0">
            {day.dayName.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
              {day.dayName}
            </div>
            <div className="flex items-center text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
              <Calendar className="w-3 h-3 mr-1 text-slate-400" />
              <span>{day.formattedDate}</span>
            </div>
          </div>
        </div>

        {/* Selectores de Bloques Horarios */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 flex-1">
          {/* Opción 1: Horario 1 */}
          <button
            type="button"
            disabled={isReadOnly}
            onClick={() => onBlockChange(day.date, AvailabilityBlock.HORARIO_1)}
            className={`p-2.5 rounded-xl border text-xs transition-all flex items-center justify-between cursor-pointer ${
              day.selectedBlock === AvailabilityBlock.HORARIO_1
                ? 'bg-blue-600 text-white border-blue-600 font-bold shadow-sm'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/80'
            } ${isReadOnly ? 'cursor-not-allowed opacity-80' : ''}`}
          >
            <div className="flex items-center space-x-2 truncate">
              <Sun className="w-3.5 h-3.5 flex-shrink-0" />
              <div className="truncate text-left">
                <div className="text-[11px] leading-tight">Horario 1</div>
                <div className="text-[9px] opacity-80 font-mono flex items-center mt-0.5">
                  <Clock className="w-2.5 h-2.5 mr-0.5 flex-shrink-0" />
                  <span>{h1Time}</span>
                </div>
              </div>
            </div>
            {day.selectedBlock === AvailabilityBlock.HORARIO_1 && (
              <Check className="w-3.5 h-3.5 ml-1 flex-shrink-0" />
            )}
          </button>

          {/* Opción 2: Horario 2 */}
          <button
            type="button"
            disabled={isReadOnly}
            onClick={() => onBlockChange(day.date, AvailabilityBlock.HORARIO_2)}
            className={`p-2.5 rounded-xl border text-xs transition-all flex items-center justify-between cursor-pointer ${
              day.selectedBlock === AvailabilityBlock.HORARIO_2
                ? 'bg-amber-600 text-white border-amber-600 font-bold shadow-sm'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/80'
            } ${isReadOnly ? 'cursor-not-allowed opacity-80' : ''}`}
          >
            <div className="flex items-center space-x-2 truncate">
              <Moon className="w-3.5 h-3.5 flex-shrink-0" />
              <div className="truncate text-left">
                <div className="text-[11px] leading-tight">Horario 2</div>
                <div className="text-[9px] opacity-80 font-mono flex items-center mt-0.5">
                  <Clock className="w-2.5 h-2.5 mr-0.5 flex-shrink-0" />
                  <span>{h2Time}</span>
                </div>
              </div>
            </div>
            {day.selectedBlock === AvailabilityBlock.HORARIO_2 && (
              <Check className="w-3.5 h-3.5 ml-1 flex-shrink-0" />
            )}
          </button>

          {/* Opción 3: Jornada Completa */}
          <button
            type="button"
            disabled={isReadOnly}
            onClick={() => onBlockChange(day.date, AvailabilityBlock.FULL)}
            className={`p-2.5 rounded-xl border text-xs transition-all flex items-center justify-between cursor-pointer ${
              day.selectedBlock === AvailabilityBlock.FULL
                ? 'bg-emerald-600 text-white border-emerald-600 font-bold shadow-sm'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/80'
            } ${isReadOnly ? 'cursor-not-allowed opacity-80' : ''}`}
          >
            <div className="flex items-center space-x-2 truncate">
              <Check className="w-3.5 h-3.5 flex-shrink-0" />
              <div className="truncate text-left">
                <div className="text-[11px] leading-tight font-semibold">Jornada Completa</div>
                <div className="text-[9px] opacity-80 font-mono flex items-center mt-0.5">
                  <Clock className="w-2.5 h-2.5 mr-0.5 flex-shrink-0" />
                  <span>{fullTime}</span>
                </div>
              </div>
            </div>
            {day.selectedBlock === AvailabilityBlock.FULL && (
              <Check className="w-3.5 h-3.5 ml-1 flex-shrink-0" />
            )}
          </button>

          {/* Opción 4: No Disponible */}
          <button
            type="button"
            disabled={isReadOnly}
            onClick={() => onBlockChange(day.date, AvailabilityBlock.NO)}
            className={`p-2.5 rounded-xl border text-xs transition-all flex items-center justify-between cursor-pointer ${
              day.selectedBlock === AvailabilityBlock.NO
                ? 'bg-rose-600 text-white border-rose-600 font-bold shadow-sm'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/80'
            } ${isReadOnly ? 'cursor-not-allowed opacity-80' : ''}`}
          >
            <div className="flex items-center space-x-2 truncate">
              <X className="w-3.5 h-3.5 flex-shrink-0" />
              <div className="truncate text-left">
                <div className="text-[11px] leading-tight font-semibold">No Disponible</div>
                <div className="text-[9px] opacity-80 mt-0.5">Sin disponibilidad</div>
              </div>
            </div>
            {day.selectedBlock === AvailabilityBlock.NO && (
              <Check className="w-3.5 h-3.5 ml-1 flex-shrink-0" />
            )}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Tarjeta 1: Lunes - Viernes */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
        {/* Cabecera Tarjeta 1 */}
        <div className="px-5 py-4 bg-slate-50/80 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Lunes - Viernes
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Disponibilidad para jornadas escolares, formativas y ligas vespertinas
            </p>
          </div>

          {/* Horarios de Referencia */}
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-slate-600 dark:text-slate-300">
            <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <Sun className="w-3 h-3 mr-1 text-blue-500" />
              H1: {weekdayH1}
            </span>
            <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <Moon className="w-3 h-3 mr-1 text-amber-500" />
              H2: {weekdayH2}
            </span>
            <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <Check className="w-3 h-3 mr-1 text-emerald-500" />
              Jornada: {weekdayFull}
            </span>
          </div>
        </div>

        {/* Lista de Filas de Días Hábiles */}
        <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
          {weekdayDays.map((day) => renderDayRow(day, weekdayH1, weekdayH2, weekdayFull))}
        </div>
      </div>

      {/* Tarjeta 2: Sábado - Domingo */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-blue-200 dark:border-blue-900/40 shadow-sm overflow-hidden transition-colors">
        {/* Cabecera Tarjeta 2 */}
        <div className="px-5 py-4 bg-blue-50/60 dark:bg-blue-950/20 border-b border-blue-100 dark:border-blue-900/40 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Sábado - Domingo
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Disponibilidad para torneos oficiales y competencias de fin de semana
            </p>
          </div>

          {/* Horarios de Referencia */}
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-slate-600 dark:text-slate-300">
            <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <Sun className="w-3 h-3 mr-1 text-blue-500" />
              H1: {weekendH1}
            </span>
            <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <Moon className="w-3 h-3 mr-1 text-amber-500" />
              H2: {weekendH2}
            </span>
            <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <Check className="w-3 h-3 mr-1 text-emerald-500" />
              Jornada: {weekendFull}
            </span>
          </div>
        </div>

        {/* Lista de Filas de Fin de Semana */}
        <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
          {weekendDays.map((day) => renderDayRow(day, weekendH1, weekendH2, weekendFull))}
        </div>
      </div>
    </div>
  );
};

export default WeeklyCalendarGrid;
