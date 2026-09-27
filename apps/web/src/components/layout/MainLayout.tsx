import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { DevAuthSwitcher } from '../auth/DevAuthSwitcher';

export const MainLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      <Navbar />

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

      {/* Dev Switcher activo para pruebas y evaluación */}
      <DevAuthSwitcher />
    </div>
  );
};

export default MainLayout;
