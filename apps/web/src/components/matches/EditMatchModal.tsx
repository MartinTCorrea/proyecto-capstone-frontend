import React, { useState, useEffect } from 'react';
import { X, Calendar, MapPin, AlertTriangle, Clock, Edit3 } from 'lucide-react';
import { matchesApi, MatchItem, UpdateMatchPayload } from '../../api/matches.api';
import { MatchStatus } from '@sgaob/shared';

interface EditMatchModalProps {
  match: MatchItem | null;
  isOpen: boolean;
  onClose: () => void;
  onMatchUpdated: () => void;
}

export const EditMatchModal: React.FC<EditMatchModalProps> = ({
  match,
  isOpen,
  onClose,
  onMatchUpdated,
}) => {
  const [tournament, setTournament] = useState('');
  const [category, setCategory] = useState('');
  const [homeTeam, setHomeTeam] = useState('');
  const [awayTeam, setAwayTeam] = useState('');
  const [venue, setVenue] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('19:30');
  const [status, setStatus] = useState<MatchStatus>(MatchStatus.SCHEDULED);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (match) {
      setTournament(match.tournament);
      setCategory(match.category);
      setHomeTeam(match.homeTeam);
      setAwayTeam(match.awayTeam);
      setVenue(match.venue);
      setStatus(match.status);

      if (match.matchDateTime) {
        const d = new Date(match.matchDateTime);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        setDate(`${yyyy}-${mm}-${dd}`);

        const hh = String(d.getHours()).padStart(2, '0');
        const min = String(d.getMinutes()).padStart(2, '0');
        setTime(`${hh}:${min}`);
      }
      setError(null);
    }
  }, [match]);

  if (!isOpen || !match) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      setLoading(true);

      const [year, month, day] = date.split('-').map(Number);
      const [hours, minutes] = time.split(':').map(Number);
      const localDate = new Date(year, month - 1, day, hours, minutes);
      const isoDateTime = localDate.toISOString();

      const payload: UpdateMatchPayload = {
        tournament: tournament.trim(),
        category: category.trim(),
        homeTeam: homeTeam.trim(),
        awayTeam: awayTeam.trim(),
        venue: venue.trim(),
        matchDateTime: isoDateTime,
        status,
      };

      await matchesApi.updateMatch(match.id, payload);
      onMatchUpdated();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Error al actualizar el partido');
    } finally {
      setLoading(false);
    }
  };

  const isStatusCritical =
    status === MatchStatus.SUSPENDED ||
    status === MatchStatus.CANCELLED ||
    status === MatchStatus.RESCHEDULED;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-match-title"
    >
      <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-200">
        {/* Cabecera */}
        <div className="bg-slate-800 px-6 py-4 flex justify-between items-center text-white">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-white/10 rounded-lg">
              <Edit3 className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 id="edit-match-title" className="text-lg font-bold">
                Modificar Partido / Actualizar Estado (RF10)
              </h2>
              <p className="text-xs text-slate-300">
                {match.homeTeam} vs {match.awayTeam}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white hover:bg-white/10 rounded-lg p-1.5 transition-colors"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-700">
              {error}
            </div>
          )}

          {isStatusCritical && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start space-x-2.5 text-xs text-amber-800">
              <AlertTriangle className="w-4 h-4 mt-0.5 text-amber-600 shrink-0" />
              <div>
                <strong>Aviso de Notificación RF10:</strong> Al guardar este partido como <em>{status}</em> o cambiar su horario, el sistema despachará automáticamente alertas por correo a todos los árbitros u oficiales que ya estén nominados.
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Estado del Partido *
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as MatchStatus)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={MatchStatus.SCHEDULED}>Programado (Normal)</option>
                <option value={MatchStatus.RESCHEDULED}>Reprogramado (Cambio horario)</option>
                <option value={MatchStatus.SUSPENDED}>Suspendido</option>
                <option value={MatchStatus.CANCELLED}>Cancelado Definitivamente</option>
                <option value={MatchStatus.COMPLETED}>Finalizado</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Recinto / Gimnasio *
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  required
                  className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                />
                <MapPin className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1 flex items-center space-x-1">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                <span>Fecha Programada *</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1 flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                <span>Hora de Inicio *</span>
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Equipo Local
              </label>
              <input
                type="text"
                value={homeTeam}
                onChange={(e) => setHomeTeam(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Equipo Visitante
              </label>
              <input
                type="text"
                value={awayTeam}
                onChange={(e) => setAwayTeam(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors disabled:opacity-50"
            >
              {loading ? 'Guardando Cambios...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
