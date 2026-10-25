import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { RoleName, NominationStatus, MatchRole } from '@sgaob/shared';
import {
  nominationsApi,
  NominationItem,
  QueryNominationsParams,
} from '../api/nominations.api';
import { matchesApi, MatchItem } from '../api/matches.api';
import { MatchesAssignmentsGrid } from '../components/nominations/MatchesAssignmentsGrid';
import { NominationsTable } from '../components/nominations/NominationsTable';
import { AssignNominationModal } from '../components/nominations/AssignNominationModal';
import { RespondNominationModal } from '../components/nominations/RespondNominationModal';
import {
  ClipboardCheck,
  RefreshCw,
  Search,
  Layers,
  List,
  UserCheck,
  Clock,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

export const NominationsPage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.roles?.includes(RoleName.ADMIN_COMISION_TECNICA) ?? false;

  // Tabs: 'grid' (grilla por partido), 'table' (listado plano de nominaciones), 'mine' (mis asignaciones)
  const [activeTab, setActiveTab] = useState<'grid' | 'table' | 'mine'>(
    isAdmin ? 'grid' : 'mine',
  );

  // Estados de datos
  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [nominations, setNominations] = useState<NominationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros
  const [filterTournament, setFilterTournament] = useState<string>('');
  const [filterVenue, setFilterVenue] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Modales
  const [assignModalOpen, setAssignModalOpen] = useState<boolean>(false);
  const [selectedMatchForAssign, setSelectedMatchForAssign] = useState<MatchItem | null>(null);
  const [selectedRoleForAssign, setSelectedRoleForAssign] = useState<MatchRole>(
    MatchRole.ARBITRO_PRINCIPAL,
  );

  const [respondModalOpen, setRespondModalOpen] = useState<boolean>(false);
  const [selectedNominationForRespond, setSelectedNominationForRespond] =
    useState<NominationItem | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const nomParams: QueryNominationsParams = {
        limit: 100,
      };

      if (filterStatus !== 'ALL') {
        nomParams.status = filterStatus as NominationStatus;
      }
      if (startDate) nomParams.startDate = startDate;
      if (endDate) nomParams.endDate = endDate;

      // Si es pestaña "Mis Asignaciones", filtrar por el usuario conectado
      if (activeTab === 'mine' && user?.id) {
        nomParams.userId = user.id;
      }

      const [nomsResponse, matchesResponse] = await Promise.all([
        nominationsApi.getNominations(nomParams),
        matchesApi.getMatches({
          limit: 50,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          tournament: filterTournament || undefined,
          venue: filterVenue || undefined,
        }),
      ]);

      setNominations(nomsResponse.data || []);
      setMatches(matchesResponse.data || []);
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          'Error al cargar las asignaciones y cartelera de partidos.',
      );
    } finally {
      setLoading(false);
    }
  }, [activeTab, user?.id, filterStatus, startDate, endDate, filterTournament, filterVenue]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenAssignModal = (match: MatchItem, role: MatchRole) => {
    setSelectedMatchForAssign(match);
    setSelectedRoleForAssign(role);
    setAssignModalOpen(true);
  };

  const handleOpenRespondModal = (nomination: NominationItem) => {
    setSelectedNominationForRespond(nomination);
    setRespondModalOpen(true);
  };

  const handleDeleteNomination = async (id: string) => {
    if (!window.confirm('¿Confirmas que deseas desvincular a este árbitro/oficial del partido?')) {
      return;
    }
    try {
      await nominationsApi.deleteNomination(id);
      await loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al eliminar la designación');
    }
  };

  // Contadores para métricas
  const totalCount = nominations.length;
  const pendingCount = nominations.filter((n) => n.status === NominationStatus.PENDING).length;
  const confirmedCount = nominations.filter((n) => n.status === NominationStatus.CONFIRMED).length;
  const rejectedCount = nominations.filter((n) => n.status === NominationStatus.REJECTED).length;

  return (
    <div className="space-y-6">
      {/* Cabecera Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors duration-200">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-slate-800 border dark:border-blue-900/40 flex items-center justify-center text-blue-700 dark:text-blue-400">
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Designaciones y Ternas
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Supervisión y ratificación de ternas arbitrales y mesa de control.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => loadData()}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-2xs disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Recargar Asignaciones</span>
          </button>
        </div>
      </div>

      {/* Tarjetas de Métricas de Asignaciones */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs transition-colors duration-200">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Asignaciones</p>
          <div className="flex items-baseline justify-between mt-1">
            <p className="text-2xl font-black text-slate-900 dark:text-white">{totalCount}</p>
            <span className="text-xs text-slate-400 dark:text-slate-500">Registradas</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-amber-200 dark:border-amber-900/40 shadow-2xs bg-amber-50/20 dark:bg-slate-800/40 transition-colors duration-200">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
            <Clock className="w-3.5 h-3.5" />
            <span>Pendientes</span>
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <p className="text-2xl font-black text-amber-900 dark:text-amber-300">{pendingCount}</p>
            <span className="text-xs text-amber-700 dark:text-amber-400 font-medium">Por confirmar</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/40 shadow-2xs bg-emerald-50/20 dark:bg-slate-800/40 transition-colors duration-200">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Confirmadas</span>
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <p className="text-2xl font-black text-emerald-900 dark:text-emerald-300">{confirmedCount}</p>
            <span className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">Ratificadas</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-rose-200 dark:border-rose-900/40 shadow-2xs bg-rose-50/20 dark:bg-slate-800/40 transition-colors duration-200">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400">
            <XCircle className="w-3.5 h-3.5" />
            <span>Rechazadas</span>
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <p className="text-2xl font-black text-rose-900 dark:text-rose-300">{rejectedCount}</p>
            <span className="text-xs text-rose-700 dark:text-rose-400 font-medium">Con motivo</span>
          </div>
        </div>
      </div>

      {/* Pestañas de Vista */}
      <div className="border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div className="flex space-x-1">
          {isAdmin && (
            <button
              type="button"
              onClick={() => setActiveTab('grid')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                activeTab === 'grid'
                  ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/30'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Cartelera de Partidos y Ternas</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveTab('mine')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'mine'
                ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/30'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Mis Asignaciones</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('table')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'table'
                ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/30'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            <List className="w-4 h-4" />
            <span>Listado Consolidado</span>
          </button>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 transition-colors duration-200">
        {/* Filtro Torneo */}
        <div>
          <label className="block text-caption font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
            Torneo
          </label>
          <div className="relative">
            <input
              type="text"
              value={filterTournament}
              onChange={(e) => setFilterTournament(e.target.value)}
              placeholder="Ej. LNB Chile, Escolar..."
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 absolute left-2.5 top-2.5" />
          </div>
        </div>

        {/* Filtro Recinto */}
        <div>
          <label className="block text-caption font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
            Recinto / Gimnasio
          </label>
          <div className="relative">
            <input
              type="text"
              value={filterVenue}
              onChange={(e) => setFilterVenue(e.target.value)}
              placeholder="Ej. CEO Ñuñoa, Palestino..."
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 absolute left-2.5 top-2.5" />
          </div>
        </div>

        {/* Filtro Estado */}
        <div>
          <label className="block text-caption font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
            Estado Designación
          </label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full px-3 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-slate-50/50 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
          >
            <option value="ALL">Todos los Estados</option>
            <option value={NominationStatus.PENDING}>Pendientes</option>
            <option value={NominationStatus.CONFIRMED}>Confirmadas</option>
            <option value={NominationStatus.REJECTED}>Rechazadas</option>
          </select>
        </div>

        {/* Filtro Fecha Desde */}
        <div>
          <label className="block text-caption font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
            Desde
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-2.5 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-slate-50/50 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
          />
        </div>

        {/* Filtro Fecha Hasta */}
        <div>
          <label className="block text-caption font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
            Hasta
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-2.5 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-slate-50/50 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
          />
        </div>
      </div>

      {/* Mensaje de Error si lo hay */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-300 text-xs">
          {error}
        </div>
      )}

      {/* Contenido según Pestaña Activa */}
      {activeTab === 'grid' ? (
        <MatchesAssignmentsGrid
          matches={matches}
          nominations={nominations}
          isLoading={loading}
          onOpenAssignModal={handleOpenAssignModal}
          onOpenRespondModal={handleOpenRespondModal}
          onDeleteNomination={handleDeleteNomination}
          isAdmin={isAdmin}
          currentUserId={user?.id}
        />
      ) : activeTab === 'mine' ? (
        <div className="space-y-4">
          <div className="bg-blue-50/60 dark:bg-slate-800/60 border border-blue-200 dark:border-blue-900/40 rounded-xl p-4 text-xs text-blue-900 dark:text-blue-300 flex items-start gap-2.5">
            <UserCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Mis Designaciones Activas</p>
              <p className="mt-0.5 text-blue-800 dark:text-blue-400">
                Aquí visualizas los partidos a los que has sido nominado por la Comisión Técnica. Recuerda confirmar tu asistencia con anticipación o rechazar indicando el motivo para gestionar reemplazos oportunamente.
              </p>
            </div>
          </div>
          <NominationsTable
            nominations={nominations}
            isLoading={loading}
            onOpenRespondModal={handleOpenRespondModal}
            onDeleteNomination={handleDeleteNomination}
            isAdmin={isAdmin}
            currentUserId={user?.id}
          />
        </div>
      ) : (
        <NominationsTable
          nominations={nominations}
          isLoading={loading}
          onOpenRespondModal={handleOpenRespondModal}
          onDeleteNomination={handleDeleteNomination}
          isAdmin={isAdmin}
          currentUserId={user?.id}
        />
      )}

      {/* Modal de Designación */}
      <AssignNominationModal
        isOpen={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        match={selectedMatchForAssign}
        initialRole={selectedRoleForAssign}
        onNominationCreated={loadData}
      />

      {/* Modal de Respuesta */}
      <RespondNominationModal
        isOpen={respondModalOpen}
        onClose={() => setRespondModalOpen(false)}
        nomination={selectedNominationForRespond}
        onResponded={loadData}
      />
    </div>
  );
};

export default NominationsPage;
