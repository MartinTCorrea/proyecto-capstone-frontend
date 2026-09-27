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
                ? 'bg-blue-50/40 border-blue-200'
                : 'bg-white border-slate-200'
            }`}
          >
            {/* Cabecera del día */}
            <div className="border-b border-slate-100 pb-2.5 mb-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
                  {day.dayName}
                </span>
                <span
                  className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                    isWeekend
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {isWeekend ? 'Finde' : 'Laboral'}
                </span>
              </div>
              <div className="flex items-center text-xs text-slate-500 font-mono mt-1">
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
                className={`w-full text-left p-2 rounded-lg border text-xs transition-all flex items-center justify-between ${
                  day.selectedBlock === AvailabilityBlock.HORARIO_1
                    ? 'bg-blue-600 text-white border-blue-600 font-bold shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
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
                className={`w-full text-left p-2 rounded-lg border text-xs transition-all flex items-center justify-between ${
                  day.selectedBlock === AvailabilityBlock.HORARIO_2
                    ? 'bg-amber-600 text-white border-amber-600 font-bold shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
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

              {/* Opción 3: Full (Ambos) */}
              <button
                type="button"
                disabled={isReadOnly}
                onClick={() => onBlockChange(day.date, AvailabilityBlock.FULL)}
                className={`w-full text-left p-2 rounded-lg border text-xs transition-all flex items-center justify-between ${
                  day.selectedBlock === AvailabilityBlock.FULL
                    ? 'bg-emerald-600 text-white border-emerald-600 font-bold shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                } ${isReadOnly ? 'cursor-not-allowed opacity-80' : ''}`}
              >
                <div className="flex items-center space-x-1.5">
                  <Check className="w-3.5 h-3.5 flex-shrink-0" />
                  <div>
                    <div className="text-[11px] leading-tight">Full Day</div>
                    <div className="text-[9px] opacity-80 mt-0.5">Ambos horarios</div>
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
                className={`w-full text-left p-2 rounded-lg border text-xs transition-all flex items-center justify-between ${
                  day.selectedBlock === AvailabilityBlock.NO
                    ? 'bg-slate-700 text-white border-slate-700 font-bold shadow-sm'
                    : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                } ${isReadOnly ? 'cursor-not-allowed opacity-80' : ''}`}
              >
                <div className="flex items-center space-x-1.5">
                  <X className="w-3.5 h-3.5 flex-shrink-0 text-rose-400" />
                  <span className="text-[11px]">No disponible</span>
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
