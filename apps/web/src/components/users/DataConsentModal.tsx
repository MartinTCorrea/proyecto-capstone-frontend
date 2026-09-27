import React, { useState } from 'react';
import { usersApi } from '../../api/users.api';
import { useAuth } from '../../hooks/useAuth';
import { ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';

interface DataConsentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DataConsentModal: React.FC<DataConsentModalProps> = ({ isOpen, onClose }) => {
  const { refreshProfile } = useAuth();
  const [agreed, setAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) return;

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      await usersApi.recordConsent();
      await refreshProfile();
      onClose();
    } catch (err: any) {
      setErrorMsg(
        err.response?.data?.message || 'Error al registrar el consentimiento.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="consent-modal-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center space-x-3 px-6 py-4 bg-slate-900 text-white">
          <ShieldCheck className="w-6 h-6 text-emerald-400 flex-shrink-0" />
          <div>
            <h2 id="consent-modal-title" className="text-base font-bold">
              Consentimiento de Tratamiento de Datos (RF01)
            </h2>
            <p className="text-[11px] text-slate-400">
              Cumplimiento normativo de privacidad de datos personales
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="text-xs text-slate-600 space-y-2 bg-slate-50 border border-slate-200 p-4 rounded-xl leading-relaxed max-h-48 overflow-y-auto">
            <p className="font-semibold text-slate-800">
              Términos de Privacidad y Tratamiento de Información en SGAOB:
            </p>
            <p>
              En conformidad con la legislación aplicable sobre protección de la vida privada y datos de carácter personal, se informa que los datos proporcionados (nombre, correo electrónico, teléfono, disponibilidad horaria y designaciones arbitrales) serán utilizados exclusivamente para los siguientes fines institucionales:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Gestión operativa del padrón de árbitros y oficiales de mesa.</li>
              <li>Recepción y procesamiento de declaraciones de disponibilidad horaria.</li>
              <li>Asignación formal de nominaciones a partidos de básquetbol.</li>
              <li>Envío de notificaciones operativas vía correo electrónico.</li>
              <li>Auditoría y trazabilidad de designaciones técnicas.</li>
            </ul>
            <p className="text-slate-500 italic">
              Al confirmar este formulario, se registrará la fecha y tu dirección IP de conexión como constancia de aceptación informada.
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center space-x-2 text-rose-700 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <label className="flex items-start space-x-3 p-3 rounded-xl border border-slate-200 bg-emerald-50/40 cursor-pointer hover:bg-emerald-50/70 transition-colors">
            <input
              type="checkbox"
              required
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
            />
            <span className="text-xs font-semibold text-slate-800 leading-tight">
              He leído y acepto el tratamiento de mis datos personales para la gestión operativa en el sistema SGAOB.
            </span>
          </label>

          <div className="pt-2 flex justify-end space-x-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 rounded-lg transition-colors"
            >
              Recordar más tarde
            </button>
            <button
              type="submit"
              disabled={!agreed || isSubmitting}
              className={`px-5 py-2 text-xs font-bold text-white rounded-lg shadow-sm transition-all flex items-center space-x-1.5 ${
                agreed && !isSubmitting
                  ? 'bg-emerald-600 hover:bg-emerald-700 focus:ring-2 focus:ring-emerald-500'
                  : 'bg-slate-300 cursor-not-allowed'
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Registrando...</span>
                </>
              ) : (
                <span>Confirmar y Continuar</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DataConsentModal;
