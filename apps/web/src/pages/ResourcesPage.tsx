import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { RoleName, ResourceType } from '@sgaob/shared';
import { resourcesApi, ResourceItem } from '../api/resources.api';
import { ResourceCard } from '../components/resources/ResourceCard';
import { CreateResourceModal } from '../components/resources/CreateResourceModal';
import { EditResourceModal } from '../components/resources/EditResourceModal';
import { ExportNominationsModal } from '../components/resources/ExportNominationsModal';
import {
  FolderArchive,
  Megaphone,
  FileText,
  Key,
  Plus,
  RefreshCw,
  Search,
  FileSpreadsheet,
  AlertCircle,
} from 'lucide-react';

export const ResourcesPage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.roles?.includes(RoleName.ADMIN_COMISION_TECNICA) ?? false;

  // Tabs: 'COMUNICADO', 'DOCUMENTO', 'CREDENCIAL'
  const [activeTab, setActiveTab] = useState<ResourceType>(ResourceType.COMUNICADO);
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Modales
  const [createModalOpen, setCreateModalOpen] = useState<boolean>(false);
  const [editModalOpen, setEditModalOpen] = useState<boolean>(false);
  const [exportModalOpen, setExportModalOpen] = useState<boolean>(false);
  const [selectedResourceForEdit, setSelectedResourceForEdit] = useState<ResourceItem | null>(null);

  const loadResources = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await resourcesApi.getResources({
        type: activeTab,
        search: searchTerm.trim() || undefined,
        limit: 50,
      });
      setResources(response.data || []);
    } catch (err: any) {
      setError(
        err.response?.data?.message || 'Error al cargar los recursos y comunicados.',
      );
    } finally {
      setLoading(false);
    }
  }, [activeTab, searchTerm]);

  useEffect(() => {
    loadResources();
  }, [loadResources]);

  const handleOpenEdit = (resource: ResourceItem) => {
    setSelectedResourceForEdit(resource);
    setEditModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await resourcesApi.deleteResource(id);
      loadResources();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al eliminar el recurso.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Encabezado Principal */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-brand-50 border border-brand-200/60 flex items-center justify-center text-brand-700">
            <FolderArchive className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Centro de Documentación y Recursos
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Bases reglamentarias, comunicados oficiales y exportación de planillas
            </p>
          </div>
        </div>

        {/* Acciones Superiores */}
        <div className="flex flex-wrap items-center gap-2">
          {isAdmin && (
            <>
              <button
                type="button"
                onClick={() => setExportModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl border border-emerald-200 transition-colors shadow-2xs cursor-pointer"
                title="Exportar Grilla de Asignaciones a Excel"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Exportar Asignaciones</span>
              </button>

              <button
                type="button"
                onClick={() => setCreateModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Publicar Recurso</span>
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => loadResources()}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-2xs disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Actualizar</span>
          </button>
        </div>
      </div>

      {/* Pestañas de Categoría */}
      <div className="border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
        <div className="flex space-x-1">
          <button
            type="button"
            onClick={() => setActiveTab(ResourceType.COMUNICADO)}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === ResourceType.COMUNICADO
                ? 'border-purple-600 text-purple-700 bg-purple-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
            }`}
          >
            <Megaphone className="w-4 h-4 text-purple-600" />
            <span>Tablón de Comunicados</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab(ResourceType.DOCUMENTO)}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === ResourceType.DOCUMENTO
                ? 'border-blue-600 text-blue-700 bg-blue-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
            }`}
          >
            <FileText className="w-4 h-4 text-blue-600" />
            <span>Documentos y Protocolos</span>
          </button>

          {isAdmin && (
            <button
              type="button"
              onClick={() => setActiveTab(ResourceType.CREDENCIAL)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                activeTab === ResourceType.CREDENCIAL
                  ? 'border-rose-600 text-rose-700 bg-rose-50/50'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
              }`}
            >
              <Key className="w-4 h-4 text-rose-600" />
              <span>Bóveda de Credenciales de Planillaje</span>
            </button>
          )}
        </div>

        {/* Buscador Textual */}
        <div className="pb-2 w-full sm:w-72">
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por título o texto..."
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 bg-white"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          </div>
        </div>
      </div>

      {/* Alerta de Error */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
          {error}
        </div>
      )}

      {/* Grid de Recursos */}
      {loading ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <div className="w-8 h-8 border-3 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-500">Cargando publicaciones y recursos...</p>
        </div>
      ) : resources.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-3">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">
            No se encontraron {activeTab.toLowerCase()}s
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {searchTerm
              ? 'No hay resultados que coincidan con el término de búsqueda.'
              : 'Aún no se han registrado publicaciones en esta categoría.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {resources.map((res) => (
            <ResourceCard
              key={res.id}
              resource={res}
              isAdmin={isAdmin}
              onEdit={handleOpenEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Modales */}
      <CreateResourceModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreated={loadResources}
        initialType={activeTab}
      />

      <EditResourceModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        resource={selectedResourceForEdit}
        onUpdated={loadResources}
      />

      <ExportNominationsModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
      />
    </div>
  );
};

export default ResourcesPage;
