import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AvailabilityBlock, DayType, RoleName, TimeBlockConfigDto } from '@sgaob/shared';
import { availabilityApi } from '../api/availability.api';
import { useAuth } from '../hooks/useAuth';
import { WeeklyCalendarGrid, DayAvailabilityState } from '../components/availability/WeeklyCalendarGrid';
import { DeadlineStatusBadge } from '../components/availability/DeadlineStatusBadge';
import { AvailabilitySummaryView } from '../components/availability/AvailabilitySummaryView';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Save,
  CheckCircle,
  AlertCircle,
  Clock,
  Users,
} from 'lucide-react';

const DAY_NAMES = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

export const AvailabilityPage: React.FC = () => {
  const { hasRole } = useAuth();
  const isAdmin = hasRole(RoleName.ADMIN_COMISION_TECNICA);

  // Pestañas (disponible para todos la declaración; consolidado solo para CT)
  const [activeTab, setActiveTab] = useState<'MY_AVAILABILITY' | 'CT_SUMMARY'>('MY_AVAILABILITY');

  // Desplazamiento semanal (0 = semana actual, 1 = próxima semana, etc.)
  const [weekOffset, setWeekOffset] = useState<number>(0);

  const [timeBlocks, setTimeBlocks] = useState<TimeBlockConfigDto[]>([]);
  const [dailyAvailabilities, setDailyAvailabilities] = useState<Record<string, AvailabilityBlock>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Calcula el lunes de la semana seleccionada
  const weekMonday = useMemo(() => {
    const today = new Date();
    today.setDate(today.getDate() + weekOffset * 7);

    const day = today.getDay(); // 0 = Domingo, 1 = Lunes
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(today.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
  }, [weekOffset]);

  // Calcula los 7 días de la semana (Lunes a Domingo)
  const weekDays = useMemo<DayAvailabilityState[]>(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekMonday);
      d.setDate(weekMonday.getDate() + i);

      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const dateNum = String(d.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${dateNum}`;

      const isWeekend = i >= 5; // Sábado (5) y Domingo (6)

      return {
        date: dateStr,
        dayName: DAY_NAMES[i],
        formattedDate: d.toLocaleDateString('es-CL', { day: 'numeric', month: 'short' }),
        dayType: isWeekend ? DayType.FIN_DE_SEMANA : DayType.LABORAL,
        selectedBlock: dailyAvailabilities[dateStr] || AvailabilityBlock.NO,
      };
    });
  }, [weekMonday, dailyAvailabilities]);

  // Plazo límite: Miércoles de la semana a las 23:59:59
  const weekDeadline = useMemo(() => {
    const wednesday = new Date(weekMonday);
    wednesday.setDate(weekMonday.getDate() + 2);
    wednesday.setHours(23, 59, 59, 999);
    return wednesday;
  }, [weekMonday]);

  const isPastDeadline = useMemo(() => {
    return new Date().getTime() > weekDeadline.getTime();
  }, [weekDeadline]);

  // Si venció el plazo y no es Admin, la interfaz entra en solo lectura
  const isReadOnly = isPastDeadline && !isAdmin;

  // Carga inicial de bloques y disponibilidad existente
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setFeedback(null);
    try {
      const sunday = new Date(weekMonday);
      sunday.setDate(weekMonday.getDate() + 6);

      const mondayStr = weekMonday.toISOString().split('T')[0];
      const sundayStr = sunday.toISOString().split('T')[0];

      const [blocks, userAvail] = await Promise.all([
        availabilityApi.getTimeBlocks(),
        availabilityApi.getMyAvailability({ startDate: mondayStr, endDate: sundayStr }),
      ]);

      setTimeBlocks(blocks);

      const availMap: Record<string, AvailabilityBlock> = {};
      userAvail.forEach((record) => {
        availMap[record.date] = record.block;
      });
      setDailyAvailabilities(availMap);
    } catch (err: any) {
      console.error('Error al cargar datos de disponibilidad:', err);
      setFeedback({
        type: 'error',
        message: 'No fue posible cargar tu disponibilidad. Intenta nuevamente.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [weekMonday]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Cambio reactivo de un bloque para un día específico
  const handleBlockChange = (date: string, block: AvailabilityBlock) => {
    if (isReadOnly) return;
    setDailyAvailabilities((prev) => ({
      ...prev,
      [date]: block,
    }));
  };

  // Guardado masivo y atómico
  const handleSave = async () => {
    if (isReadOnly) return;
    setIsSaving(true);
    setFeedback(null);

    try {
      const availabilities = Object.entries(dailyAvailabilities).map(([date, block]) => ({
        date,
        block,
      }));

      await availabilityApi.declareBulk(availabilities);

      setFeedback({
        type: 'success',
        message: 'Tu declaración semanal de disponibilidad fue guardada exitosamente.',
      });
    } catch (err: any) {
      console.error('Error al guardar disponibilidad:', err);
      setFeedback({
        type: 'error',
        message:
          err.response?.data?.message ||
          'Ocurrió un error al guardar la disponibilidad. Verifica que el plazo no haya expirado.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Encabezado y Navegación de Pestañas */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-colors duration-200">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-slate-800 border dark:border-blue-900/40 flex items-center justify-center text-blue-700 dark:text-blue-400 shadow-inner">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Disponibilidad Horaria Semanal
              </h1>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Declaración de bloques para asignación de partidos (Árbitros y Oficiales de Mesa).
            </p>
          </div>
        </div>

        {/* Pestañas si es Admin */}
        {isAdmin && (
          <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold">
            <button
              onClick={() => setActiveTab('MY_AVAILABILITY')}
              className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 cursor-pointer ${
                activeTab === 'MY_AVAILABILITY'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Mi Calendario</span>
            </button>
            <button
              onClick={() => setActiveTab('CT_SUMMARY')}
              className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 cursor-pointer ${
                activeTab === 'CT_SUMMARY'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Consolidado General</span>
            </button>
          </div>
        )}
      </div>

      {activeTab === 'CT_SUMMARY' && isAdmin ? (
        <AvailabilitySummaryView />
      ) : (
        <>
          {/* Barra de Control Semanal y Estado del Plazo */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-colors duration-200">
            {/* Selector de Semana */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setWeekOffset((prev) => prev - 1)}
                className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                title="Semana anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="px-3 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-800 dark:text-slate-200">
                Semana: {weekDays[0]?.formattedDate} - {weekDays[6]?.formattedDate}
                {weekOffset === 0 && (
                  <span className="ml-2 text-2xs text-brand-600 dark:text-brand-400 font-semibold">(Actual)</span>
                )}
                {weekOffset === 1 && (
                  <span className="ml-2 text-2xs text-emerald-600 dark:text-emerald-400 font-semibold">(Próxima)</span>
                )}
              </div>

              <button
                onClick={() => setWeekOffset((prev) => prev + 1)}
                className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                title="Semana siguiente"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              {weekOffset !== 0 && (
                <button
                  onClick={() => setWeekOffset(0)}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold ml-2 cursor-pointer"
                >
                  Ir a Semana Actual
                </button>
              )}
            </div>

            {/* Semáforo de Plazo Límite (Miércoles 23:59) */}
            <DeadlineStatusBadge deadline={weekDeadline} isAdmin={isAdmin} />
          </div>

          {/* Feedback de guardado */}
          {feedback && (
            <div
              className={`p-4 rounded-xl border flex items-center space-x-3 text-xs font-medium ${
                feedback.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/60 text-emerald-800 dark:text-emerald-300'
                  : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-300'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 flex-shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
          )}

          {/* Cuadrícula interactiva de 7 días */}
          {isLoading ? (
            <div className="bg-white dark:bg-slate-900 p-12 rounded-xl border border-slate-200 dark:border-slate-800">
              <LoadingSpinner message="Cargando calendario semanal y parámetros de bloques..." size="lg" />
            </div>
          ) : (
            <WeeklyCalendarGrid
              days={weekDays}
              timeBlocks={timeBlocks}
              isReadOnly={isReadOnly}
              onBlockChange={handleBlockChange}
            />
          )}

          {/* Botón de Guardado Masivo */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-3 transition-colors duration-200">
            <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center space-x-1.5">
              <Clock className="w-4 h-4 text-slate-400" />
              <span>
                Los cambios se guardan de forma atómica para todos los días seleccionados.
              </span>
            </div>

            <button
              onClick={handleSave}
              disabled={isReadOnly || isSaving || isLoading}
              className={`inline-flex items-center px-6 py-2.5 rounded-xl font-bold text-xs shadow-sm transition-all focus:ring-2 focus:ring-blue-500 cursor-pointer ${
                isReadOnly
                  ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              <Save className="w-4 h-4 mr-1.5" />
              <span>{isSaving ? 'Guardando disponibilidad...' : 'Guardar Disponibilidad Semanal'}</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default AvailabilityPage;
