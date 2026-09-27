import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { DevAuthSwitcher } from '../auth/DevAuthSwitcher';
import { DataConsentModal } from '../users/DataConsentModal';
import { useAuth } from '../../hooks/useAuth';
import { AlertCircle, ShieldCheck } from 'lucide-react';

export const MainLayout: React.FC = () => {
  const { user } = useAuth();
  const [isConsentModalOpen, setIsConsentModalOpen] = useState(false);

  const needsConsent = !!user && !user.dataConsent;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      <Navbar />

      {/* Banner de Aviso de Consentimiento de Datos Pendiente (RF01) */}
      {needsConsent && (
        <div className="bg-amber-500 text-white px-4 py-2.5 shadow-sm text-xs font-medium flex items-center justify-between">
          <div className="max-w-7xl mx-auto w-full flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>
                <strong>Aviso de Privacidad (RF01):</strong> Aún no has registrado el consentimiento formal para el tratamiento de tus datos personales.
              </span>
            </div>
            <button
              onClick={() => setIsConsentModalOpen(true)}
              className="px-3 py-1 bg-white text-amber-900 rounded-lg font-bold hover:bg-amber-50 transition-colors flex items-center space-x-1 shadow-sm"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Aceptar Consentimiento</span>
            </button>
          </div>
        </div>
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0">
          <p>© 2026 SGAOB — Sistema de Gestión de Árbitros y Oficiales de Básquetbol.</p>
          <div className="flex items-center space-x-4">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-100 text-emerald-800">
              API Online (:3000)
            </span>
            <span className="text-slate-400">|</span>
            <span>Proyecto Capstone</span>
          </div>
        </div>
      </footer>

      {/* Modal de Consentimiento de Datos */}
      <DataConsentModal
        isOpen={isConsentModalOpen}
        onClose={() => setIsConsentModalOpen(false)}
      />

      {/* Dev Switcher activo para pruebas y evaluación */}
      <DevAuthSwitcher />
    </div>
  );
};

export default MainLayout;
