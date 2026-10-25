import React, { useState, useEffect } from 'react';
import { ResourceType, ResourceVisibility } from '@sgaob/shared';
import { resourcesApi, ResourceItem, UpdateResourcePayload } from '../../api/resources.api';
import { parseCredentialData, serializeCredentialData } from './credentialHelper';
import {
  X,
  Edit3,
  AlertTriangle,
  Lock,
  Mail,
  Eye,
  EyeOff,
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
  const [credentialEmail, setCredentialEmail] = useState<string>('');
  const [credentialPassword, setCredentialPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
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

      if (resource.type === ResourceType.CREDENCIAL) {
        const parsed = parseCredentialData(resource.content);
        setCredentialEmail(parsed.email);
        setCredentialPassword(parsed.password);
      }
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

    let finalContent: string | undefined = undefined;
    if (isCredential) {
      if (!credentialEmail.trim()) {
        setError('El correo o usuario de la cuenta es obligatorio.');
        return;
      }
      if (!credentialPassword.trim()) {
        setError('La contraseña de la cuenta es obligatoria.');
        return;
      }
      finalContent = serializeCredentialData({
        email: credentialEmail,
        password: credentialPassword,
      });
    } else {
      finalContent = content.trim() || undefined;
    }

    setSubmitting(true);
    setError(null);

    try {
      const payload: UpdateResourcePayload = {
        title: title.trim(),
        description: description.trim() || undefined,
        fileUrl: fileUrl.trim() || undefined,
        content: finalContent,
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
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/40">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-950/40 border border-brand-200/60 dark:border-brand-800/60 flex items-center justify-center text-brand-700 dark:text-brand-300">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h2 id="edit-resource-title" className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {isCredential ? 'Editar Cuenta de Planillaje' : `Editar ${resource.type.toLowerCase()}`}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Actualiza los datos o credenciales de la cuenta
              </p>
            </div>
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
              {isCredential ? 'Nombre / Título de la Cuenta *' : 'Título *'}
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
              Descripción Breve
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
            />
          </div>

          {isDocument && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                URL del Documento o Archivo
              </label>
              <input
                type="url"
                value={fileUrl}
                onChange={(e) => setFileUrl(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 font-mono bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
              />
            </div>
          )}

          {/* Componentes de Cuenta (Si es Credencial) */}
          {isCredential ? (
            <div className="space-y-3 p-3.5 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Correo / Usuario de Acceso *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    value={credentialEmail}
                    onChange={(e) => setCredentialEmail(e.target.value)}
                    placeholder="ej: mesa1@asociacion.cl o nbn23_cancha1"
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 font-mono bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Contraseña de la Cuenta *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={credentialPassword}
                    onChange={(e) => setCredentialPassword(e.target.value)}
                    placeholder="Contraseña de acceso"
                    className="w-full pl-9 pr-10 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 font-mono bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
                    title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                Contenido del Comunicado
              </label>
              <textarea
                rows={5}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
              Visibilidad
            </label>
            {isCredential ? (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-300 flex items-center gap-2">
                <Lock className="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0" />
                <span>
                  <strong>ADMIN (Fijo):</strong> Credenciales reservadas exclusivamente para Comisión Técnica.
                </span>
              </div>
            ) : (
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as ResourceVisibility)}
                className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-950"
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
              className="px-4 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
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