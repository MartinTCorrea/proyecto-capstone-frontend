import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { matchesApi, MatchItem, MatchesPaginationMeta } from '../api/matches.api';
import { MatchesTable } from '../components/matches/MatchesTable';
import { CreateMatchModal } from '../components/matches/CreateMatchModal';
import { EditMatchModal } from '../components/matches/EditMatchModal';
import { SyncControlModal } from '../components/matches/SyncControlModal';
import { RoleName, MatchStatus, MatchPlatform, MatchTimeBlock } from '@sgaob/shared';
import {
  Trophy,
  Plus,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export const MatchesPage: React.FC = () => {
  const { user, hasRole } = useAuth();
  const isCT = hasRole(RoleName.ADMIN_COMISION_TECNICA);

  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [meta, setMeta] = useState<MatchesPaginationMeta>({
    total: 0,
    page: 1,
    limit: 15,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Filtros
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [platformFilter, setPlatformFilter] = useState<string>('');
  const [timeBlockFilter, setTimeBlockFilter] = useState<string>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modales
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<MatchItem | null>(null);
  const [matchToDelete, setMatchToDelete] = useState<MatchItem | null>(null);

  const fetchMatches = useCallback(
    async (pageToLoad = meta.page) => {
      try {
        setLoading(true);
        const res = await matchesApi.getMatches({
          page: pageToLoad,
          limit: meta.limit,
          tournament: search.trim() || undefined,
          status: statusFilter ? (statusFilter as MatchStatus) : undefined,
          platform: platformFilter ? (platformFilter as MatchPlatform) : undefined,
          timeBlock: timeBlockFilter ? (timeBlockFilter as MatchTimeBlock) : undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        });
        setMatches(res.data);
        setMeta(res.meta);
      } catch (err: any) {
        setFeedback({
          type: 'error',
          message: err?.response?.data?.message || 'Error al cargar cartelera de partidos',
        });
      } finally {
        setLoading(false);
      }
    },
    [meta.page, meta.limit, search, statusFilter, platformFilter, timeBlockFilter, startDate, endDate],
  );

  useEffect(() => {
    fetchMatches(1);
  }, [statusFilter, platformFilter, timeBlockFilter, startDate, endDate]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchMatches(1);
  };

  const handleEditMatch = (match: MatchItem) => {
    setSelectedMatch(match);
    setIsEditModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!matchToDelete) return;
    try {
      await matchesApi.deleteMatch(matchToDelete.id);
      setFeedback({ type: 'success', message: 'Partido eliminado exitosamente' });
      setMatchToDelete(null);
      fetchMatches();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err?.response?.data?.message || 'Error al eliminar el partido',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Encabezado y Acciones Principales */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <Trophy className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">
              Cartelera de Partidos
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Programación oficial, sincronización federativa y gestión de encuentros deportivos
          </p>
        </div>

        {/* Acciones exclusivas Comisión Técnica */}
        {isCT && (
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setIsSyncModalOpen(true)}
              className="inline-flex items-center px-4 py-2 text-sm font-semibold rounded-lg text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 transition-colors shadow-sm"
              title="Sincronizar cartelera desde Swish / NBN23 (RF09)"
            >
              <RefreshCw className="w-4 h-4 mr-2 text-slate-600" />
              Sincronizar (RF09)
            </button>

            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center px-4 py-2 text-sm font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm"
              title="Crear partido manual sin depender de APIs externas (100% Autónomo)"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Nuevo Partido Manual
            </button>
          </div>
        )}
      </div>

      {/* Banner de Feedback */}
      {feedback && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between shadow-sm animate-in fade-in duration-200 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center space-x-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span className="text-sm font-medium">{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-xs font-bold uppercase tracking-wider underline hover:opacity-75"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Barra de Filtros */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por torneo, equipo o recinto..."
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          </div>

          <button
            type="submit"
            className="inline-flex items-center justify-center px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            Buscar
          </button>
        </form>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5 pt-2 border-t border-slate-100">
          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Estado</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos los estados</option>
              <option value={MatchStatus.SCHEDULED}>Programados</option>
              <option value={MatchStatus.RESCHEDULED}>Reprogramados (RF10)</option>
              <option value={MatchStatus.SUSPENDED}>Suspendidos (RF10)</option>
              <option value={MatchStatus.CANCELLED}>Cancelados</option>
              <option value={MatchStatus.COMPLETED}>Finalizados</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Origen</label>
            <select
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todas las plataformas</option>
              <option value={MatchPlatform.MANUAL}>Manual (Local)</option>
              <option value={MatchPlatform.SWISH}>Swish</option>
              <option value={MatchPlatform.NBN23}>NBN23</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Bloque Horario</label>
            <select
              value={timeBlockFilter}
              onChange={(e) => setTimeBlockFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos los bloques</option>
              <option value={MatchTimeBlock.HORARIO_1}>Horario 1</option>
              <option value={MatchTimeBlock.HORARIO_2}>Horario 2</option>
              <option value={MatchTimeBlock.AMBOS}>Ambos Bloques</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Desde</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Hasta</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Contenido / Tabla */}
      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent mb-3" />
          <p className="text-sm font-semibold text-slate-600">Cargando cartelera de partidos...</p>
        </div>
      ) : (
        <MatchesTable
          matches={matches}
          userRoles={user?.roles || []}
          onEditMatch={handleEditMatch}
          onDeleteMatch={(match) => setMatchToDelete(match)}
        />
      )}

      {/* Paginación */}
      {!loading && meta.totalPages > 1 && (
        <div className="bg-white rounded-xl border border-slate-200 px-6 py-3 flex items-center justify-between shadow-sm">
          <div className="text-xs text-slate-500 font-medium">
            Mostrando página <strong>{meta.page}</strong> de <strong>{meta.totalPages}</strong> ({meta.total} partidos en total)
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => fetchMatches(meta.page - 1)}
              disabled={meta.page <= 1}
              className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
            >
              Anterior
            </button>
            <button
              onClick={() => fetchMatches(meta.page + 1)}
              disabled={meta.page >= meta.totalPages}
              className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}

      {/* Modales */}
      <CreateMatchModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onMatchCreated={() => {
          setFeedback({ type: 'success', message: 'Partido manual creado exitosamente' });
          fetchMatches(1);
        }}
      />

      <EditMatchModal
        match={selectedMatch}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedMatch(null);
        }}
        onMatchUpdated={() => {
          setFeedback({ type: 'success', message: 'Partido y estado actualizados exitosamente (RF10)' });
          fetchMatches();
        }}
      />

      <SyncControlModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        onSyncCompleted={() => {
          setFeedback({ type: 'success', message: 'Sincronización encolada en BullMQ exitosamente' });
          // Esperar brevemente a que el worker procese y recargar
          setTimeout(() => fetchMatches(1), 1500);
        }}
      />

      {/* Modal de confirmación de eliminación */}
      {matchToDelete && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 border border-slate-200">
            <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 text-center">¿Eliminar este partido?</h3>
            <p className="text-xs text-slate-500 text-center mt-1">
              Esta acción no se puede deshacer. Se eliminará el partido {matchToDelete.homeTeam} vs {matchToDelete.awayTeam}.
            </p>
            <div className="flex justify-end space-x-2 mt-5">
              <button
                onClick={() => setMatchToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm"
              >
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MatchesPage;
