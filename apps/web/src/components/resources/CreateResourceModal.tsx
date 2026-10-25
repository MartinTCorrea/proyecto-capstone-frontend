import React, { useState } from 'react';
import { ResourceType, ResourceVisibility } from '@sgaob/shared';
import { resourcesApi, CreateResourcePayload } from '../../api/resources.api';
import { serializeCredentialData } from './credentialHelper';
import {
  X,
  PlusCircle,
  AlertTriangle,
  FileText,
  Megaphone,
  Key,
  Lock,
  Mail,
  Eye,
  EyeOff,
} from 'lucide-react';

interface CreateResourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
  initialType?: ResourceType;
}

export const CreateResourceModal: React.FC<CreateResourceModalProps> = ({
  isOpen,
  onClose,
  onCreated,
  initialType = ResourceType.COMUNICADO,
}) => {
  const [type, setType] = useState<ResourceType>(initialType);
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

  if (!isOpen) return null;

  const isCredential = type === ResourceType.CREDENCIAL;
  const isDocument = type === ResourceType.DOCUMENTO;

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
      const payload: CreateResourcePayload = {
        type,
        title: title.trim(),
        description: description.trim() || undefined,
        fileUrl: fileUrl.trim() || undefined,
        content: finalContent,
        // Si es credencial, el backend forzará ADMIN, pero lo sincronizamos desde UI
        visibility: isCredential ? ResourceVisibility.ADMIN : visibility,
      };

      await resourcesApi.createResource(payload);
      onCreated();
      onClose();
    } catch (err: any) {
      setError(
        err.response?.data?.message || 'Error al guardar el recurso. Verifica los datos ingresados.',
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
      aria-labelledby="create-resource-title"
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Cabecera */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-brand-50 border border-brand-200/60 flex items-center justify-center text-brand-700">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 id="create-resource-title" className="text-lg font-bold text-slate-900">
                Nuevo Recurso o Comunicado
              </h2>
              <p className="text-xs text-slate-500">
                Publica normativas, comunicados técnicos o credenciales seguras
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
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

          {/* Selector de Tipo de Recurso */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Tipo de Publicación
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setType(ResourceType.COMUNICADO)}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all cursor-pointer ${
                  type === ResourceType.COMUNICADO
                    ? 'border-purple-600 bg-purple-50 text-purple-900 ring-2 ring-purple-500/20 shadow-xs'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                }`}
              >
                <Megaphone className="w-5 h-5 mb-1 text-purple-600" />
                <span className="text-xs font-bold">Comunicado</span>
              </button>

              <button
                type="button"
                onClick={() => setType(ResourceType.DOCUMENTO)}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all cursor-pointer ${
                  type === ResourceType.DOCUMENTO
                    ? 'border-blue-600 bg-blue-50 text-blue-900 ring-2 ring-blue-500/20 shadow-xs'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                }`}
              >
                <FileText className="w-5 h-5 mb-1 text-blue-600" />
                <span className="text-xs font-bold">Documento</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setType(ResourceType.CREDENCIAL);
                  setVisibility(ResourceVisibility.ADMIN);
                }}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all cursor-pointer ${
                  type === ResourceType.CREDENCIAL
                    ? 'border-rose-600 bg-rose-50 text-rose-900 ring-2 ring-rose-500/20 shadow-xs'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                }`}
              >
                <Key className="w-5 h-5 mb-1 text-rose-600" />
                <span className="text-xs font-bold">Credencial</span>
              </button>
            </div>
          </div>

          {/* Título */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              {isCredential ? 'Nombre / Título de la Cuenta *' : 'Título *'}
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                isCredential
                  ? 'Ej. Cuenta Mesa 1 - NBN23, Acceso Swish Árbitros...'
                  : 'Ej. Reglamento FIBA 2026, Aviso de Reunión...'
              }
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              required
            />
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Descripción Breve
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={
                isCredential
                  ? 'Resumen de asignación o cancha asignada a esta cuenta...'
                  : 'Resumen del documento o motivo del aviso...'
              }
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            />
          </div>

          {/* URL de Archivo (Si es Documento) */}
          {isDocument && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                URL del Documento o Archivo
              </label>
              <input
                type="url"
                value={fileUrl}
                onChange={(e) => setFileUrl(e.target.value)}
                placeholder="https://storage.sgaob.cl/documentos/reglamento.pdf"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 font-mono"
              />
            </div>
          )}

          {/* Componentes de Cuenta (Si es Credencial) */}
          {isCredential ? (
            <div className="space-y-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
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
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 font-mono bg-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
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
                    className="w-full pl-9 pr-10 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 font-mono bg-white"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Contenido Texto para Comunicados */
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Contenido del Comunicado
              </label>
              <textarea
                rows={5}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Escribe aquí el texto detallado del comunicado..."
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              />
            </div>
          )}

          {/* Visibilidad */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Visibilidad de Acceso
            </label>
            {isCredential ? (
              <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
                <Lock className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>
                  <strong>Acceso Restringido:</strong> Las credenciales tienen visibilidad reservada exclusivamente para la Comisión Técnica.
                </span>
              </div>
            ) : (
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as ResourceVisibility)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-slate-700"
              >
                <option value={ResourceVisibility.AUTHENTICATED}>
                  AUTHENTICATED — Visible para todo el personal autenticado (Árbitros y Mesa)
                </option>
                <option value={ResourceVisibility.PUBLIC}>
                  PUBLIC — Visible abiertamente sin iniciar sesión
                </option>
                <option value={ResourceVisibility.ADMIN}>
                  ADMIN — Solo visible para Comisión Técnica
                </option>
              </select>
            )}
          </div>

          {/* Botones */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
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
                  <span>
                    {type === ResourceType.CREDENCIAL
                      ? 'Guardando credencial...'
                      : type === ResourceType.DOCUMENTO
                      ? 'Subiendo documento...'
                      : 'Publicando comunicado...'}
                  </span>
                </>
              ) : (
                <span>
                  {type === ResourceType.CREDENCIAL
                    ? 'Guardar Credencial de Planillaje'
                    : type === ResourceType.DOCUMENTO
                    ? 'Subir y Guardar Documento'
                    : 'Publicar Comunicado Oficial'}
                </span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
