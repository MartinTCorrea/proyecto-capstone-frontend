import React, { useState } from 'react';
import { X, RefreshCw, CheckCircle2, AlertTriangle, ShieldCheck, Database, Layers } from 'lucide-react';
import { matchesApi } from '../../api/matches.api';
import { MatchPlatform } from '@sgaob/shared';

interface SyncControlModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSyncCompleted: () => void;
}

export const SyncControlModal: React.FC<SyncControlModalProps> = ({
  isOpen,
  onClose,
  onSyncCompleted,
}) => {
  const [platform, setPlatform] = useState<MatchPlatform>(MatchPlatform.SWISH);
  const [isMock, setIsMock] = useState(true);
  const [testingConnection, setTestingConnection] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [connectionResult, setConnectionResult] = useState<{ success: boolean; message: string } | null>(null);
  const [syncResult, setSyncResult] = useState<{ success: boolean; message: string; jobId?: string; mode?: string } | null>(null);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setConnectionResult(null);
    try {
      const res = await matchesApi.testIntegration(platform);
      setConnectionResult(res);
    } catch (err: any) {
      setConnectionResult({
        success: false,
        message: err?.response?.data?.message || 'Error al conectar con la plataforma',
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleTriggerSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await matchesApi.triggerSync({
        platform,
        mock: isMock,
      });
      setSyncResult(res);
      onSyncCompleted();
    } catch (err: any) {
      setSyncResult({
        success: false,
        message: err?.response?.data?.message || 'Error al encolar la sincronización',
      });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sync-modal-title"
    >
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in duration-200">
        {/* Cabecera */}
        <div className="bg-gradient-to-r from-brand-600 to-brand-800 dark:from-slate-900 dark:to-slate-800 px-6 py-4 flex justify-between items-center text-white border-b dark:border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-white/10 rounded-lg">
              <RefreshCw className="w-5 h-5 text-blue-200" />
            </div>
            <div>
              <h2 id="sync-modal-title" className="text-lg font-bold">
                Sincronización de Cartelera Externa
              </h2>
              <p className="text-xs text-blue-200 dark:text-slate-400">
                Conexión asíncrona con reintentos y tolerancia a fallos
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white hover:bg-white/10 rounded-lg p-1.5 transition-colors cursor-pointer"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-6 space-y-5">
          {/* Selección de plataforma */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
              Plataforma de Origen
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPlatform(MatchPlatform.SWISH)}
                className={`p-3 rounded-lg border text-left flex items-start space-x-2.5 transition-all cursor-pointer ${
                  platform === MatchPlatform.SWISH
                    ? 'border-blue-600 dark:border-blue-500 bg-blue-50/70 dark:bg-blue-950/40 text-blue-900 dark:text-blue-300 ring-2 ring-blue-500/20'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-950'
                }`}
              >
                <Database className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                <div>
                  <div className="text-sm font-bold">Swish (Predeterminado)</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">Fixture federación nacional</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPlatform(MatchPlatform.NBN23)}
                className={`p-3 rounded-lg border text-left flex items-start space-x-2.5 transition-all cursor-pointer ${
                  platform === MatchPlatform.NBN23
                    ? 'border-emerald-600 dark:border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-300 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-950'
                }`}
              >
                <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                <div>
                  <div className="text-sm font-bold">NBN23 API</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">Conector externo</div>
                </div>
              </button>
            </div>
          </div>

          {/* Modo Sandbox / Mock Toggle */}
          <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-lg p-3.5 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <ShieldCheck className="w-5 h-5 text-brand-600 dark:text-brand-400 shrink-0" />
              <div>
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200">Modo Sandbox / Fixture Simulado</div>
                <div className="text-caption text-slate-500 dark:text-slate-400">
                  Genera partidos con soporte de reprogramaciones automáticas
                </div>
              </div>
            </div>
            <input
              type="checkbox"
              id="isMock"
              checked={isMock}
              onChange={(e) => setIsMock(e.target.checked)}
              className="h-4 w-4 text-blue-600 rounded border-slate-300 dark:border-slate-700 focus:ring-blue-500"
            />
          </div>

          {/* Test de conectividad */}
          <div className="pt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Diagnóstico de Conexión:</span>
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testingConnection}
                className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-semibold underline disabled:opacity-50 cursor-pointer"
              >
                {testingConnection ? 'Probando...' : 'Verificar Conectividad'}
              </button>
            </div>

            {connectionResult && (
              <div
                className={`mt-2 p-2.5 rounded-lg text-xs flex items-start space-x-2 ${
                  connectionResult.success
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                    : 'bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300'
                }`}
              >
                {connectionResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                )}
                <span>{connectionResult.message}</span>
              </div>
            )}
          </div>

          {/* Resultado de sincronización */}
          {syncResult && (
            <div
              className={`p-3 rounded-lg text-xs border ${
                syncResult.success
                  ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-300'
                  : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
              }`}
            >
              <div className="font-bold flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>{syncResult.message}</span>
              </div>
              {syncResult.jobId && (
                <div className="mt-1 text-caption text-blue-700 dark:text-blue-400">
                  ID de Tarea: <code>{syncResult.jobId}</code>
                </div>
              )}
            </div>
          )}

          {/* Botones de acción */}
          <div className="flex justify-end space-x-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              Cerrar
            </button>
            <button
              type="button"
              onClick={handleTriggerSync}
              disabled={syncing}
              className="inline-flex items-center px-5 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Sincronizando...' : 'Sincronizar Ahora'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};