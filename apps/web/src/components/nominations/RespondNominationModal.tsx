import React, { useState } from 'react';
import { NominationStatus } from '@sgaob/shared';
import { nominationsApi, NominationItem } from '../../api/nominations.api';
import { MatchRoleBadge } from './MatchRoleBadge';
import {
  X,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Calendar,
  MapPin,
  Clock,
  Send,
} from 'lucide-react';

interface RespondNominationModalProps {
  isOpen: boolean;
  onClose: () => void;
  nomination: NominationItem | null;
  onResponded: () => void;
}

export const RespondNominationModal: React.FC<RespondNominationModalProps> = ({
  isOpen,
  onClose,
  nomination,
  onResponded,
}) => {
  const [selectedStatus, setSelectedStatus] = useState<NominationStatus>(
    NominationStatus.CONFIRMED,
  );
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen || !nomination) return null;

  const match = nomination.match;
  const formattedDate = match
    ? new Date(match.matchDateTime).toLocaleDateString('es-CL', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedStatus === NominationStatus.REJECTED && (!rejectionReason.trim() || rejectionReason.trim().length < 5)) {
      setError('Debes especificar un motivo válido de rechazo (mínimo 5 caracteres) para notificar a la Comisión Técnica.');
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await nominationsApi.respondNomination(nomination.id, {
        status: selectedStatus,
        rejectionReason:
          selectedStatus === NominationStatus.REJECTED ? rejectionReason.trim() : undefined,
      });

      setSuccessMessage(
        selectedStatus === NominationStatus.CONFIRMED
          ? '¡Nominación confirmada con éxito!'
          : 'Rechazo registrado. Se ha alertado a la Comisión Técnica para reasignación.',
      );

      setTimeout(() => {
        onResponded();
        onClose();
      }, 1000);
    } catch (err: any) {
      setError(
        err.response?.data?.message || 'Error al enviar la respuesta de la nominación.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="respond-nomination-title"
    >
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Cabecera */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/40">
          <div>
            <h2 id="respond-nomination-title" className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Confirmar o Rechazar Designación
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Responde a tu designación técnica para este partido
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Ficha Resumen */}
        {match && (
          <div className="px-6 py-4 bg-slate-100/70 dark:bg-slate-950/60 border-b border-slate-200/80 dark:border-slate-800 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                {match.homeTeam} vs {match.awayTeam}
              </span>
              <MatchRoleBadge role={nomination.matchRole} />
            </div>
            <p className="text-slate-500 dark:text-slate-400">
              {match.tournament} &bull; {match.category}
            </p>
            <div className="flex flex-wrap gap-3 text-slate-600 dark:text-slate-400 pt-1">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {formattedDate}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Bloque: <strong className="text-slate-800 dark:text-slate-200">{match.timeBlock}</strong>
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                {match.venue}
              </span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Opciones de Respuesta */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Tu Respuesta:
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label
                className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                  selectedStatus === NominationStatus.CONFIRMED
                    ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40 ring-2 ring-emerald-500/20 shadow-xs'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-900'
                }`}
              >
                <input
                  type="radio"
                  name="responseStatus"
                  value={NominationStatus.CONFIRMED}
                  checked={selectedStatus === NominationStatus.CONFIRMED}
                  onChange={() => setSelectedStatus(NominationStatus.CONFIRMED)}
                  className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-slate-300 dark:border-slate-700"
                />
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100">Confirmar</span>
                </div>
              </label>

              <label
                className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                  selectedStatus === NominationStatus.REJECTED
                    ? 'border-rose-500 bg-rose-50/60 dark:bg-rose-950/40 ring-2 ring-rose-500/20 shadow-xs'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-900'
                }`}
              >
                <input
                  type="radio"
                  name="responseStatus"
                  value={NominationStatus.REJECTED}
                  checked={selectedStatus === NominationStatus.REJECTED}
                  onChange={() => setSelectedStatus(NominationStatus.REJECTED)}
                  className="w-4 h-4 text-rose-600 focus:ring-rose-500 border-slate-300 dark:border-slate-700"
                />
                <div className="flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100">Rechazar</span>
                </div>
              </label>
            </div>
          </div>

          {/* Campo de Motivo si Rechaza */}
          {selectedStatus === NominationStatus.REJECTED && (
            <div className="space-y-1.5 pt-1">
              <label className="block text-xs font-bold text-rose-950 dark:text-rose-300 uppercase tracking-wider">
                Motivo del Rechazo *
              </label>
              <textarea
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Indica el motivo de fuerza mayor o inconveniente (ej. Lesión reciente, viaje laboral imprevisto)..."
                className="w-full px-3 py-2 text-xs border border-rose-300 dark:border-rose-700 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
                required
              />
              <p className="text-caption text-rose-700 dark:text-rose-400">
                Este motivo quedará visible para la Comisión Técnica para gestionar el reemplazo.
              </p>
            </div>
          )}

          {/* Botones de Acción */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={`px-4 py-2 text-xs font-semibold text-white rounded-xl shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer ${
                selectedStatus === NominationStatus.CONFIRMED
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-rose-600 hover:bg-rose-700'
              }`}
            >
              {submitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>
                    {selectedStatus === NominationStatus.CONFIRMED
                      ? 'Confirmando asistencia...'
                      : 'Enviando rechazo...'}
                  </span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>
                    {selectedStatus === NominationStatus.CONFIRMED
                      ? 'Confirmar Asistencia al Partido'
                      : 'Enviar Rechazo de Designación'}
                  </span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};