import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export const UnauthorizedPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
      <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
        <ShieldAlert className="w-8 h-8" />
      </div>

      <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
        Acceso No Autorizado (403 Forbidden)
      </h1>

      <p className="mt-3 text-sm text-slate-600 max-w-md leading-relaxed">
        Tu perfil actual ({user?.email || 'Sesión anónima'}) no cuenta con los permisos o roles técnicos necesarios para acceder a este recurso.
      </p>

      {user?.roles && (
        <div className="mt-4 p-3 bg-slate-100 rounded-lg border border-slate-200 text-xs">
          <span className="text-slate-500 font-semibold block mb-1">Tus roles acreditados son:</span>
          <span className="font-bold text-slate-800">
            {user.roles.length > 0 ? user.roles.join(', ') : 'Ninguno (Pendiente de asignación)'}
          </span>
        </div>
      )}

      <div className="mt-8 flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
        <Link
          to="/"
          className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver al Inicio
        </Link>
      </div>
    </div>
  );
};

export default UnauthorizedPage;
