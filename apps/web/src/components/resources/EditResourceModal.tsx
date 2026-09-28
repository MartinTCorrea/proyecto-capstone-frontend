import React, { useState, useEffect } from 'react';
import { ResourceType, ResourceVisibility } from '@sgaob/shared';
import { resourcesApi, ResourceItem, UpdateResourcePayload } from '../../api/resources.api';
import {
  X,
  Edit3,
  AlertTriangle,
  Lock,
} from 'lucide-react';

interface EditResourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  resource: ResourceItem | null;
  onUpdated: () => void;
}

export const EditResourceModal: React.FC<EditResourceModalProps> = ({
  isOpen,
  onClose,
  resource,
  onUpdated,
}) => {
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [fileUrl, setFileUrl] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [visibility, setVisibility] = useState<ResourceVisibility>(
    ResourceVisibility.AUTHENTICATED,
  );

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (resource) {
      setTitle(resource.title || '');
      setDescription(resource.description || '');
      setFileUrl(resource.fileUrl || '');
      setContent(resource.content || '');
      setVisibility(resource.visibility || ResourceVisibility.AUTHENTICATED);
    }
  }, [resource]);

  if (!isOpen || !resource) return null;

  const isCredential = resource.type === ResourceType.CREDENCIAL;
  const isDocument = resource.type === ResourceType.DOCUMENTO;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || title.trim().length < 3) {
      setError('El título debe tener al menos 3 caracteres.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const payload: UpdateResourcePayload = {
        title: title.trim(),
        description: description.trim() || undefined,
        fileUrl: fileUrl.trim() || undefined,
        content: content.trim() || undefined,
        visibility: isCredential ? ResourceVisibility.ADMIN : visibility,
      };

      await resourcesApi.updateResource(resource.id, payload);
      onUpdated();
      onClose();
    } catch (err: any) {
      setError(
        err.response?.data?.message || 'Error al actualizar el recurso.',
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
      aria-labelledby="edit-resource-title"
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-brand-50 border border-brand-200/60 flex items-center justify-center text-brand-700">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h2 id="edit-resource-title" className="text-lg font-bold text-slate-900">
                Editar {resource.type.toLowerCase()}
              </h2>
              <p className="text-xs text-slate-500">
                Actualiza los datos o contenidos publicados
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Título *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Descripción Breve
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            />
          </div>

          {isDocument && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                URL del Documento o Archivo
              </label>
              <input
                type="url"
                value={fileUrl}
                onChange={(e) => setFileUrl(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 font-mono"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              {isCredential ? 'Contenido Secreto / Token *' : 'Contenido del Comunicado'}
            </label>
            <textarea
              rows={isCredential ? 3 : 5}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className={`w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 ${
                isCredential ? 'font-mono bg-slate-50' : ''
              }`}
              required={isCredential}
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Visibilidad
            </label>
            {isCredential ? (
              <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
                <Lock className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>
                  <strong>ADMIN (Fijo):</strong> Credenciales reservadas exclusivamente para Comisión Técnica.
                </span>
              </div>
            ) : (
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as ResourceVisibility)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-slate-700"
              >
                <option value={ResourceVisibility.AUTHENTICATED}>
                  AUTHENTICATED — Todo el personal autenticado
                </option>
                <option value={ResourceVisibility.PUBLIC}>
                  PUBLIC — Acceso público
                </option>
                <option value={ResourceVisibility.ADMIN}>
                  ADMIN — Solo Comisión Técnica
                </option>
              </select>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <span>Guardar Cambios</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
