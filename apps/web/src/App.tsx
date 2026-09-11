import React from 'react';

export const App: React.FC = () => {
  return (
    <main style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <header>
        <h1 style={{ color: '#1e3a8a', fontSize: '2rem', marginBottom: '0.5rem' }}>
          SGAOB
        </h1>
        <p style={{ color: '#64748b', fontSize: '1.1rem' }}>
          Sistema de Gestión de Árbitros y Oficiales de Básquetbol
        </p>
      </header>

      <section style={{ marginTop: '2rem', background: '#ffffff', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <h2 style={{ fontSize: '1.25rem', color: '#334155' }}>Estado del Entorno</h2>
        <p>Monorepo inicializado con éxito. Workspaces activos:</p>
        <ul>
          <li><strong>apps/api</strong>: NestJS + TypeScript</li>
          <li><strong>apps/web</strong>: React + TypeScript + Vite</li>
          <li><strong>packages/shared</strong>: Contratos y enums compartidos</li>
        </ul>
      </section>
    </main>
  );
};

export default App;

