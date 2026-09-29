import React, { useState } from 'react';
import { X, Calendar, MapPin, Trophy, Shield, Clock, AlertCircle, Info } from 'lucide-react';
import { matchesApi, CreateMatchPayload } from '../../api/matches.api';
import { MatchPlatform } from '@sgaob/shared';

interface CreateMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMatchCreated: () => void;
}

export const CreateMatchModal: React.FC<CreateMatchModalProps> = ({
  isOpen,
  onClose,
  onMatchCreated,
}) => {
  const [tournament, setTournament] = useState('');
  const [category, setCategory] = useState('Adulto Varones');
  const [homeTeam, setHomeTeam] = useState('');
  const [awayTeam, setAwayTeam] = useState('');
  const [venue, setVenue] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('19:30');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!tournament.trim() || !category.trim() || !homeTeam.trim() || !awayTeam.trim() || !venue.trim() || !date) {
      setError('Por favor completa todos los campos obligatorios.');
      return;
    }

    try {
      setLoading(true);
      // Combinar fecha y hora en formato ISO 8601 UTC
      const [year, month, day] = date.split('-').map(Number);
      const [hours, minutes] = time.split(':').map(Number);
      const localDate = new Date(year, month - 1, day, hours, minutes);
      const isoDateTime = localDate.toISOString();

      const payload: CreateMatchPayload = {
        tournament: tournament.trim(),
        category: category.trim(),
        homeTeam: homeTeam.trim(),
        awayTeam: awayTeam.trim(),
        venue: venue.trim(),
        matchDateTime: isoDateTime,
        platform: MatchPlatform.MANUAL,
      };

      await matchesApi.createMatch(payload);
      onMatchCreated();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Error al crear el partido manual');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-match-title"
    >
      <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-200">
        {/* Cabecera */}
        <div className="bg-gradient-to-r from-blue-700 to-indigo-800 px-6 py-4 flex justify-between items-center text-white">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-white/10 rounded-lg">
              <Trophy className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h2 id="create-match-title" className="text-lg font-bold">
                Nuevo Partido (Gestión Manual)
              </h2>
              <p className="text-xs text-blue-200">
                100% Autónomo: Registra partidos de ligas locales o escolares sin depender de APIs externas
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
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start space-x-2 text-sm text-rose-700">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Torneo / Competencia *
              </label>
              <input
                type="text"
                value={tournament}
                onChange={(e) => setTournament(e.target.value)}
                placeholder="Ej. Copa Soprole Básquetbol"
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Categoría *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="Adulto Varones">Adulto Varones</option>
                <option value="Adulto Damas">Adulto Damas</option>
                <option value="Sub-18 Varones">Sub-18 Varones</option>
                <option value="Sub-16 Varones">Sub-16 Varones</option>
                <option value="Sub-14 Infantil">Sub-14 Infantil</option>
                <option value="Universitario Varones">Universitario Varones</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1 flex items-center space-x-1">
                <Shield className="w-3.5 h-3.5 text-blue-600" />
                <span>Equipo Local *</span>
              </label>
              <input
                type="text"
                value={homeTeam}
                onChange={(e) => setHomeTeam(e.target.value)}
                placeholder="Ej. Universidad Católica"
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1 flex items-center space-x-1">
                <Shield className="w-3.5 h-3.5 text-indigo-600" />
                <span>Equipo Visitante *</span>
              </label>
              <input
                type="text"
                value={awayTeam}
                onChange={(e) => setAwayTeam(e.target.value)}
                placeholder="Ej. Colegio Los Leones"
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1 flex items-center space-x-1">
              <MapPin className="w-3.5 h-3.5 text-rose-500" />
              <span>Gimnasio / Recinto Deportivo *</span>
            </label>
            <input
              type="text"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              placeholder="Ej. Estadio Palestino, Las Condes"
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1 flex items-center space-x-1">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                <span>Fecha del Partido *</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-600 flex items-start space-x-2">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <strong>Cálculo Automático:</strong> El bloque horario (Horario 1, Horario 2 o Ambos) será determinado por el sistema en función del día y la hora programada para el partido.
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex justify-end space-x-3 pt-3 border-t border-slate-200">
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
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Creando Partido...
                </>
              ) : (
                'Guardar Partido'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
