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
  // Encuentra la configuración horaria específica para un día y bloque
  const getBlockTimes = (dayType: DayType, code: TimeBlockCode) => {
    const config = timeBlocks.find(
      (b) => b.dayType === dayType && b.blockCode === code,
    );
    if (!config) return code === TimeBlockCode.HORARIO_1 ? 'H1' : 'H2';
    return `${config.startTime} - ${config.endTime}`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-3">
      {days.map((day) => {
        const h1Time = getBlockTimes(day.dayType, TimeBlockCode.HORARIO_1);
        const h2Time = getBlockTimes(day.dayType, TimeBlockCode.HORARIO_2);
        const isWeekend = day.dayType === DayType.FIN_DE_SEMANA;

        return (
          <div
            key={day.date}
            className={`rounded-xl border p-4 flex flex-col justify-between transition-all ${
              isWeekend
                ? 'bg-blue-50/40 dark:bg-slate-900 border-blue-200 dark:border-blue-900/40'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
            }`}
          >
            {/* Cabecera del día */}
            <div className="border-b border-slate-100 dark:border-slate-800 pb-2.5 mb-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-100">
                  {day.dayName}
                </span>
                <span
                  className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border ${
                    isWeekend
                      ? 'bg-blue-100 dark:bg-slate-800 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900/40'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {isWeekend ? 'Finde' : 'Laboral'}
                </span>
              </div>
              <div className="flex items-center text-xs text-slate-500 dark:text-slate-400 font-mono mt-1">
                <Calendar className="w-3 h-3 mr-1 text-slate-400" />
                <span>{day.formattedDate}</span>
              </div>
            </div>

            {/* Opciones de bloques horarios */}
            <div className="space-y-2 flex-1">
              {/* Opción 1: Horario 1 */}
              <button
                type="button"
                disabled={isReadOnly}
                onClick={() => onBlockChange(day.date, AvailabilityBlock.HORARIO_1)}
                className={`w-full text-left p-2 rounded-lg border text-xs transition-all flex items-center justify-between cursor-pointer ${
                  day.selectedBlock === AvailabilityBlock.HORARIO_1
                    ? 'bg-blue-600 text-white border-blue-600 font-bold shadow-sm'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/80'
                } ${isReadOnly ? 'cursor-not-allowed opacity-80' : ''}`}
              >
                <div className="flex items-center space-x-1.5 overflow-hidden">
                  <Sun className="w-3.5 h-3.5 flex-shrink-0" />
                  <div className="truncate">
                    <div className="text-[11px] leading-tight">Horario 1</div>
                    <div className="text-[9px] opacity-80 font-mono flex items-center mt-0.5">
                      <Clock className="w-2.5 h-2.5 mr-0.5" />
                      {h1Time}
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
                className={`w-full text-left p-2 rounded-lg border text-xs transition-all flex items-center justify-between cursor-pointer ${
                  day.selectedBlock === AvailabilityBlock.HORARIO_2
                    ? 'bg-amber-600 text-white border-amber-600 font-bold shadow-sm'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/80'
                } ${isReadOnly ? 'cursor-not-allowed opacity-80' : ''}`}
              >
                <div className="flex items-center space-x-1.5 overflow-hidden">
                  <Moon className="w-3.5 h-3.5 flex-shrink-0" />
                  <div className="truncate">
                    <div className="text-[11px] leading-tight">Horario 2</div>
                    <div className="text-[9px] opacity-80 font-mono flex items-center mt-0.5">
                      <Clock className="w-2.5 h-2.5 mr-0.5" />
                      {h2Time}
                    </div>
                  </div>
                </div>
                {day.selectedBlock === AvailabilityBlock.HORARIO_2 && (
                  <Check className="w-3.5 h-3.5 ml-1 flex-shrink-0" />
                )}
              </button>

              {/* Opción 3: Jornada Completa (Full Day) */}
              <button
                type="button"
                disabled={isReadOnly}
                onClick={() => onBlockChange(day.date, AvailabilityBlock.FULL)}
                className={`w-full text-left p-2 rounded-lg border text-xs transition-all flex items-center justify-between cursor-pointer ${
                  day.selectedBlock === AvailabilityBlock.FULL
                    ? 'bg-emerald-600 text-white border-emerald-600 font-bold shadow-sm'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/80'
                } ${isReadOnly ? 'cursor-not-allowed opacity-80' : ''}`}
              >
                <div className="flex items-center space-x-1.5">
                  <Check className="w-3.5 h-3.5 flex-shrink-0" />
                  <div>
                    <div className="text-[11px] leading-tight font-semibold">Jornada Completa</div>
                    <div className="text-[9px] opacity-80">H1 + H2 disponible</div>
                  </div>
                </div>
                {day.selectedBlock === AvailabilityBlock.FULL && (
                  <Check className="w-3.5 h-3.5 ml-1 flex-shrink-0" />
                )}
              </button>

              {/* Opción 4: No disponible */}
              <button
                type="button"
                disabled={isReadOnly}
                onClick={() => onBlockChange(day.date, AvailabilityBlock.NO)}
                className={`w-full text-left p-2 rounded-lg border text-xs transition-all flex items-center justify-between cursor-pointer ${
                  day.selectedBlock === AvailabilityBlock.NO
                    ? 'bg-rose-600 text-white border-rose-600 font-bold shadow-sm'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/80'
                } ${isReadOnly ? 'cursor-not-allowed opacity-80' : ''}`}
              >
                <div className="flex items-center space-x-1.5">
                  <X className="w-3.5 h-3.5 flex-shrink-0" />
                  <div>
                    <div className="text-[11px] leading-tight font-semibold">No Disponible</div>
                    <div className="text-[9px] opacity-80">Sin disponibilidad</div>
                  </div>
                </div>
                {day.selectedBlock === AvailabilityBlock.NO && (
                  <Check className="w-3.5 h-3.5 ml-1 flex-shrink-0" />
                )}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default WeeklyCalendarGrid;
