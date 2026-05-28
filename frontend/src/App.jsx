import { useState } from 'react';
import Dashboard from './components/Dashboard';
import Turnos from './components/Turnos';
import Medicinas from './components/Medicinas';
import HistorialClinico from './components/HistorialClinico';
import ContactosEmergencia from './components/ContactosEmergencia';
import CondicionesMedicas from './components/CondicionesMedicas';
import './index.css';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const usuarioId = 1; // Por ahora usuario fijo, después login

  return (
    <>
      <header className="header">
        <div className="container">
          <h1>💚 Health App</h1>
        </div>
      </header>

      <main className="main">
        <div className="container">
          <div className="tabs">
            <button
              className={`tab ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              📊 Dashboard
            </button>
            <button
              className={`tab ${activeTab === 'turnos' ? 'active' : ''}`}
              onClick={() => setActiveTab('turnos')}
            >
              📅 Turnos
            </button>
            <button
              className={`tab ${activeTab === 'medicinas' ? 'active' : ''}`}
              onClick={() => setActiveTab('medicinas')}
            >
              💊 Medicinas
            </button>
            <button
              className={`tab ${activeTab === 'historial' ? 'active' : ''}`}
              onClick={() => setActiveTab('historial')}
            >
              📋 Historial
            </button>
            <button
              className={`tab ${activeTab === 'contactos' ? 'active' : ''}`}
              onClick={() => setActiveTab('contactos')}
            >
              📞 Emergencia
            </button>
            <button
              className={`tab ${activeTab === 'condiciones' ? 'active' : ''}`}
              onClick={() => setActiveTab('condiciones')}
            >
              🏥 Condiciones
            </button>
          </div>

          {activeTab === 'dashboard' && <Dashboard usuarioId={usuarioId} />}
          {activeTab === 'turnos' && <Turnos usuarioId={usuarioId} />}
          {activeTab === 'medicinas' && <Medicinas usuarioId={usuarioId} />}
          {activeTab === 'historial' && <HistorialClinico usuarioId={usuarioId} />}
          {activeTab === 'contactos' && <ContactosEmergencia usuarioId={usuarioId} />}
          {activeTab === 'condiciones' && <CondicionesMedicas usuarioId={usuarioId} />}
        </div>
      </main>
    </>
  );
}
