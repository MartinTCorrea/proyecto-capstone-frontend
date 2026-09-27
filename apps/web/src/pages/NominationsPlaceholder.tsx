import React from 'react';
import { ClipboardList } from 'lucide-react';

export const NominationsPlaceholder: React.FC = () => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 sm:p-8 space-y-4">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700">
          <ClipboardList className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Nominaciones y Partidos (RF11–RF15)
          </h1>
          <p className="text-sm text-slate-500">
            Vista de asignaciones arbitrales y cruce disponibilidad↔partidos.
          </p>
        </div>
      </div>
      <p className="text-xs text-slate-600">
        Esta sección corresponde al <strong>Módulo 4 (Nominaciones)</strong> del cronograma.
      </p>
    </div>
  );
};

export default NominationsPlaceholder;
