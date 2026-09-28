import React, { useState } from 'react';
import { ResourceType, ResourceVisibility } from '@sgaob/shared';
import { ResourceItem } from '../../api/resources.api';
import { ResourceTypeBadge } from './ResourceTypeBadge';
import {
  ExternalLink,
  Download,
  Calendar,
  User,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Copy,
  Check,
  Lock,
} from 'lucide-react';

interface ResourceCardProps {
  resource: ResourceItem;
  isAdmin: boolean;
  onEdit: (resource: ResourceItem) => void;
  onDelete: (id: string) => void;
}

export const ResourceCard: React.FC<ResourceCardProps> = ({
  resource,
  isAdmin,
  onEdit,
  onDelete,
}) => {
  const [showSecret, setShowSecret] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const formattedDate = new Date(resource.createdAt).toLocaleDateString('es-CL', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const handleCopy = () => {
    if (resource.content) {
      navigator.clipboard.writeText(resource.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isCredential = resource.type === ResourceType.CREDENCIAL;
  const isDocument = resource.type === ResourceType.DOCUMENTO;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:border-slate-300 transition-all flex flex-col justify-between">
      <div className="p-5 space-y-3.5">
        {/* Encabezado de la Tarjeta */}
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <ResourceTypeBadge type={resource.type} />
              {resource.visibility === ResourceVisibility.ADMIN && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                  <Lock className="w-3 h-3" />
                  <span>Solo CT</span>
                </span>
              )}
            </div>
            <h3 className="text-base font-bold text-slate-900 line-clamp-2 mt-1">
              {resource.title}
            </h3>
          </div>

          {/* Acciones de Edición / Borrado para Comisión Técnica */}
          {isAdmin && (
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                type="button"
                onClick={() => onEdit(resource)}
                className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-slate-100 rounded-lg transition-colors"
                title="Editar recurso"
                aria-label={`Editar ${resource.title}`}
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`¿Estás seguro de eliminar "${resource.title}"?`)) {
                    onDelete(resource.id);
                  }
                }}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                title="Eliminar recurso"
                aria-label={`Eliminar ${resource.title}`}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Descripción */}
        {resource.description && (
          <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
            {resource.description}
          </p>
        )}

        {/* Contenido Texto / Comunicado */}
        {resource.content && !isCredential && (
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs text-slate-700 whitespace-pre-line leading-relaxed max-h-48 overflow-y-auto font-sans">
            {resource.content}
          </div>
        )}

        {/* Bloque Seguro de Credencial (Solo Comisión Técnica - RF18) */}
        {isCredential && (
          <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 text-white space-y-2.5">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1 font-semibold text-rose-400">
                <Lock className="w-3 h-3" />
                <span>Credencial Cifrada</span>
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setShowSecret(!showSecret)}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-300 hover:text-white transition-colors"
                >
                  {showSecret ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showSecret ? 'Ocultar' : 'Mostrar'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="ml-2 inline-flex items-center gap-1 text-[11px] font-semibold text-brand-400 hover:text-brand-300 transition-colors"
                  title="Copiar credencial"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? '¡Copiado!' : 'Copiar'}</span>
                </button>
              </div>
            </div>
            <div className="font-mono text-xs text-slate-200 bg-slate-950 p-2.5 rounded-lg border border-slate-800 break-all select-all">
              {showSecret ? resource.content : '••••••••••••••••••••••••••••••••'}
            </div>
          </div>
        )}

        {/* Botón de Enlace a Documento */}
        {isDocument && resource.fileUrl && (
          <div className="pt-1">
            <a
              href={resource.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 rounded-lg border border-brand-200 transition-colors shadow-2xs w-full justify-center"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Ver / Descargar Documento</span>
              <ExternalLink className="w-3 h-3 ml-0.5 opacity-60" />
            </a>
          </div>
        )}
      </div>

      {/* Pie de Tarjeta: Metadatos */}
      <div className="px-5 py-3 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center gap-1">
          <Calendar className="w-3 h-3 text-slate-400" />
          <span>{formattedDate}</span>
        </div>
        {resource.createdBy && (
          <div className="flex items-center gap-1 text-slate-500">
            <User className="w-3 h-3 text-slate-400" />
            <span>{resource.createdBy.firstName} {resource.createdBy.lastName}</span>
          </div>
        )}
      </div>
    </div>
  );
};
