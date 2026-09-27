import React from 'react';
import { Calendar } from 'lucide-react';

export const AvailabilityPlaceholder: React.FC = () => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 sm:p-8 space-y-4">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700">
          <Calendar className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Declaración de Disponibilidad Semanal (RF04–RF06)
          </h1>
          <p className="text-sm text-slate-500">
            Vista protegida para Árbitros y Oficiales de Mesa.
          </p>
        </div>
      </div>
      <p className="text-xs text-slate-600">
        Esta sección corresponde al <strong>Módulo 2 (Disponibilidad)</strong> según el cronograma.
      </p>
    </div>
  );
};

export default AvailabilityPlaceholder;
