import React, { useState } from 'react';
import { resourcesApi } from '../../api/resources.api';
import {
  X,
  FileSpreadsheet,
  Download,
  AlertTriangle,
  Info,
} from 'lucide-react';

interface ExportNominationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportNominationsModal: React.FC<ExportNominationsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [tournament, setTournament] = useState<string>('');
  const [venue, setVenue] = useState<string>('');
  const [downloading, setDownloading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDownload = async (e: React.FormEvent) => {
    e.preventDefault();
    setDownloading(true);
    setError(null);

    try {
      await resourcesApi.downloadNominationsCsv({
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        tournament: tournament.trim() || undefined,
        venue: venue.trim() || undefined,
      });

      onClose();
    } catch (err: any) {
      setError(
        err.response?.data?.message || 'Error al exportar la grilla de asignaciones.',
      );
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-nominations-title"
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200/60 flex items-center justify-center text-emerald-700">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 id="export-nominations-title" className="text-lg font-bold text-slate-900">
                Exportar Asignaciones (RF20)
              </h2>
              <p className="text-xs text-slate-500">
                Descarga la grilla completa en formato CSV compatible con Microsoft Excel
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleDownload} className="p-6 space-y-4">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-start gap-2">
            <Info className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            <p>
              El archivo generado incluye codificación <strong>UTF-8 BOM</strong> para que Microsoft Excel abra automáticamente tildes, recintos y nombres sin errores de formato.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Desde
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 text-slate-700"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Hasta
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 text-slate-700"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Filtrar por Torneo (Opcional)
            </label>
            <input
              type="text"
              value={tournament}
              onChange={(e) => setTournament(e.target.value)}
              placeholder="Ej. LNB Chile, Torneo Escolar..."
              className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Filtrar por Gimnasio / Recinto (Opcional)
            </label>
            <input
              type="text"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              placeholder="Ej. CEO Ñuñoa..."
              className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={downloading}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={downloading}
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              {downloading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Generando Excel...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar Archivo CSV</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
