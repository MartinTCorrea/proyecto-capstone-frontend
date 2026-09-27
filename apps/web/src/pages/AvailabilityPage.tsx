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
  Layers,
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
      const [blocks, userAvail] = await Promise.all([
        availabilityApi.getTimeBlocks(),
        availabilityApi.getMyAvailability({
          startDate: weekDays[0]?.date,
          endDate: weekDays[6]?.date,
        }),
      ]);

      setTimeBlocks(blocks);

      const map: Record<string, AvailabilityBlock> = {};
      userAvail.forEach((item) => {
        map[item.date] = item.block;
      });
      setDailyAvailabilities(map);
    } catch (err) {
      console.error('Error al cargar datos de disponibilidad:', err);
    } finally {
      setIsLoading(false);
    }
  }, [weekDays]);

  useEffect(() => {
    loadData();
  }, [weekOffset]); // Se recarga cada vez que cambia la semana

  const handleBlockChange = (date: string, block: AvailabilityBlock) => {
    if (isReadOnly) return;
    setDailyAvailabilities((prev) => ({
      ...prev,
      [date]: block,
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setFeedback(null);

    try {
      const payload = weekDays.map((d) => ({
        date: d.date,
        block: dailyAvailabilities[d.date] || AvailabilityBlock.NO,
      }));

      await availabilityApi.declareBulk(payload);
      setFeedback({
        type: 'success',
        message: '¡Disponibilidad semanal guardada y sincronizada exitosamente!',
      });
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message:
          err.response?.data?.message || 'Error al guardar la disponibilidad semanal.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Encabezado y Navegación de Pestañas */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700 shadow-inner">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                Disponibilidad Horaria Semanal
              </h1>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full border border-blue-200">
                RF04 / RF05
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Declaración de bloques para asignación de partidos (Árbitros y Oficiales de Mesa).
            </p>
          </div>
        </div>

        {/* Pestañas si es Admin */}
        {isAdmin && (
          <div className="flex p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-bold">
            <button
              onClick={() => setActiveTab('MY_AVAILABILITY')}
              className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 ${
                activeTab === 'MY_AVAILABILITY'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Mi Calendario</span>
            </button>
            <button
              onClick={() => setActiveTab('CT_SUMMARY')}
              className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 ${
                activeTab === 'CT_SUMMARY'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Consolidado CT (RF06)</span>
            </button>
          </div>
        )}
      </div>

      {activeTab === 'CT_SUMMARY' && isAdmin ? (
        <AvailabilitySummaryView />
      ) : (
        <>
          {/* Barra de Control Semanal y Estado del Plazo (RF05) */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            {/* Selector de Semana */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setWeekOffset((prev) => prev - 1)}
                className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
                title="Semana anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="px-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800">
                Semana: {weekDays[0]?.formattedDate} - {weekDays[6]?.formattedDate}
                {weekOffset === 0 && (
                  <span className="ml-2 text-[10px] text-blue-600 font-semibold">(Actual)</span>
                )}
                {weekOffset === 1 && (
                  <span className="ml-2 text-[10px] text-emerald-600 font-semibold">(Próxima)</span>
                )}
              </div>

              <button
                onClick={() => setWeekOffset((prev) => prev + 1)}
                className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
                title="Semana siguiente"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              {weekOffset !== 0 && (
                <button
                  onClick={() => setWeekOffset(0)}
                  className="text-xs text-blue-600 hover:underline font-semibold ml-2"
                >
                  Volver a hoy
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
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
          )}

          {/* Cuadrícula interactiva de 7 días */}
          {isLoading ? (
            <div className="bg-white p-12 rounded-xl border border-slate-200">
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
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-3">
            <div className="text-xs text-slate-500 flex items-center space-x-1.5">
              <Clock className="w-4 h-4 text-slate-400" />
              <span>
                Los cambios se guardan de forma atómica para todos los días seleccionados.
              </span>
            </div>

            <button
              onClick={handleSave}
              disabled={isReadOnly || isSaving || isLoading}
              className={`inline-flex items-center px-6 py-2.5 rounded-xl font-bold text-xs shadow-sm transition-all focus:ring-2 focus:ring-blue-500 ${
                isReadOnly
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              <Save className="w-4 h-4 mr-1.5" />
              <span>{isSaving ? 'Guardando disponibilidad...' : 'Guardar Disponibilidad Semanal'}</span>
            </button>
          </div>

          {/* Tarjeta explicativa de parámetros (Anexo A.4) */}
          <div className="p-4 bg-slate-100 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1 leading-relaxed">
            <p className="font-bold text-slate-800 flex items-center space-x-1.5">
              <Layers className="w-4 h-4 text-blue-600" />
              <span>Reglas de Declaración de Disponibilidad (RF04, Anexo A.3):</span>
            </p>
            <p>
              • <strong>Días Laborales (Lunes a Viernes):</strong> Horario 1 (18:30 - 20:30) y Horario 2 (20:30 - 22:30).
            </p>
            <p>
              • <strong>Fines de Semana (Sábados y Domingos):</strong> Horario 1 (09:00 - 14:00) y Horario 2 (14:00 - 21:00).
            </p>
            <p>
              • <strong>Jornada Completa (Full Day):</strong> Declara disponibilidad tanto para Horario 1 como Horario 2.
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default AvailabilityPage;
