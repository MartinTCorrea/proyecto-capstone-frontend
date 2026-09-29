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

  // Manejadores de modales
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
    try {
      await nominationsApi.deleteNomination(id);
      loadData();
    } catch (err: any) {
      alert(
        err.response?.data?.message || 'Error al revocar la asignación técnica.',
      );
    }
  };

  // Métricas calculadas para la barra superior
  const totalCount = nominations.length;
  const pendingCount = nominations.filter((n) => n.status === NominationStatus.PENDING).length;
  const confirmedCount = nominations.filter((n) => n.status === NominationStatus.CONFIRMED).length;
  const rejectedCount = nominations.filter((n) => n.status === NominationStatus.REJECTED).length;

  return (
    <div className="space-y-6">
      {/* Encabezado Principal */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-brand-50 border border-brand-200/60 flex items-center justify-center text-brand-700">
            <ClipboardCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Gestión de Nominaciones y Asignaciones
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Cruce automatizado de disponibilidad, designación técnica y confirmaciones oficiales
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => loadData()}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-2xs disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Actualizar</span>
          </button>
        </div>
      </div>

      {/* Tarjetas de Métricas de Asignaciones */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Asignaciones</p>
          <div className="flex items-baseline justify-between mt-1">
            <p className="text-2xl font-black text-slate-900">{totalCount}</p>
            <span className="text-xs text-slate-400">registradas</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-2xs bg-amber-50/20">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-700">
            <Clock className="w-3.5 h-3.5" />
            <span>Pendientes</span>
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <p className="text-2xl font-black text-amber-900">{pendingCount}</p>
            <span className="text-xs text-amber-700 font-medium">por confirmar</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-2xs bg-emerald-50/20">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-700">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Confirmadas</span>
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <p className="text-2xl font-black text-emerald-900">{confirmedCount}</p>
            <span className="text-xs text-emerald-700 font-medium">ratificadas</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-rose-200 shadow-2xs bg-rose-50/20">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-rose-700">
            <XCircle className="w-3.5 h-3.5" />
            <span>Rechazadas</span>
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <p className="text-2xl font-black text-rose-900">{rejectedCount}</p>
            <span className="text-xs text-rose-700 font-medium">con motivo</span>
          </div>
        </div>
      </div>

      {/* Pestañas de Vista */}
      <div className="border-b border-slate-200 flex items-center justify-between">
        <div className="flex space-x-1">
          {isAdmin && (
            <button
              type="button"
              onClick={() => setActiveTab('grid')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                activeTab === 'grid'
                  ? 'border-brand-600 text-brand-600 bg-brand-50/50'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
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
                ? 'border-brand-600 text-brand-600 bg-brand-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Mis Asignaciones</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('table')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'table'
                ? 'border-brand-600 text-brand-600 bg-brand-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
            }`}
          >
            <List className="w-4 h-4" />
            <span>Listado Consolidado</span>
          </button>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Filtro Torneo */}
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Torneo
          </label>
          <div className="relative">
            <input
              type="text"
              value={filterTournament}
              onChange={(e) => setFilterTournament(e.target.value)}
              placeholder="Ej. LNB Chile, Escolar..."
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 bg-slate-50/50"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          </div>
        </div>

        {/* Filtro Recinto */}
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Recinto / Gimnasio
          </label>
          <div className="relative">
            <input
              type="text"
              value={filterVenue}
              onChange={(e) => setFilterVenue(e.target.value)}
              placeholder="Ej. CEO Ñuñoa, Palestino..."
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 bg-slate-50/50"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          </div>
        </div>

        {/* Filtro Estado */}
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Estado Designación
          </label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 bg-slate-50/50 text-slate-700"
          >
            <option value="ALL">Todos los Estados</option>
            <option value={NominationStatus.PENDING}>Pendientes</option>
            <option value={NominationStatus.CONFIRMED}>Confirmadas</option>
            <option value={NominationStatus.REJECTED}>Rechazadas</option>
          </select>
        </div>

        {/* Filtro Fecha Desde */}
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Desde
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 bg-slate-50/50 text-slate-700"
          />
        </div>

        {/* Filtro Fecha Hasta */}
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Hasta
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 bg-slate-50/50 text-slate-700"
          />
        </div>
      </div>

      {/* Mensaje de Error si lo hay */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
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
          <div className="bg-brand-50/60 border border-brand-200 rounded-xl p-4 text-xs text-brand-900 flex items-start gap-2.5">
            <UserCheck className="w-4 h-4 text-brand-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Mis Designaciones Activas</p>
              <p className="mt-0.5 text-brand-800">
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
