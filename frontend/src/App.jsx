import Asistente from './components/Asistente';
import Mapa from './components/mapa';
import { useState } from 'react';
import Dashboard from './components/Dashboard';
import Turnos from './components/Turnos';
import Medicinas from './components/Medicinas';
import HistorialClinico from './components/HistorialClinico';
import ContactosEmergencia from './components/ContactosEmergencia';
import CondicionesMedicas from './components/CondicionesMedicas';
import Vacunas from './components/Vacunas';
import Prepaga from './components/Prepaga';
import Calendario from './components/Calendario';
import './index.css';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const usuarioId = 1;

  const tabs = [
    { id: 'dashboard', label: '👤 Mi Perfil' },
    { id: 'turnos', label: '📅 Turnos' },
    { id: 'medicinas', label: '💊 Medicinas' },
    { id: 'historial', label: '📋 Historial' },
    { id: 'contactos', label: '📞 Emergencia' },
    { id: 'condiciones', label: '🏥 Condiciones' },
    { id: 'vacunas', label: '💉 Vacunas' },
    { id: 'prepaga', label: '🏥 Prepaga' },
    { id: 'calendario', label: '📅 Calendario' },
    { id: 'mapa', label: '🗺️ Mapa' },
    { id: 'asistente', label: '🤖 Asistente' },
  ];

  return (
    <>
      <header className="header">
        <div className="container">
          <h1>💚 Health App</h1>
        </div>
      </header>

      <main className="main">
        <div className="container">
          <div className="tabs" style={{ flexWrap: 'wrap' }}>
            {tabs.map(t => (
              <button key={t.id} className={`tab ${activeTab === t.id ? 'active' : ''}`} onClick={() => setActiveTab(t.id)}>
                {t.label}
              </button>
            ))}
          </div>

          {activeTab === 'dashboard' && <Dashboard usuario_Id={usuarioId} />}
          {activeTab === 'turnos' && <Turnos usuario_Id={usuarioId} />}
          {activeTab === 'medicinas' && <Medicinas usuario_Id={usuarioId} />}
          {activeTab === 'historial' && <HistorialClinico usuario_id={usuarioId} />}
          {activeTab === 'contactos' && <ContactosEmergencia usuario_id={usuarioId} />}
          {activeTab === 'condiciones' && <CondicionesMedicas usuario_id={usuarioId} />}
          {activeTab === 'vacunas' && <Vacunas usuario_id={usuarioId} />}
          {activeTab === 'prepaga' && <Prepaga usuario_id={usuarioId} />}
          {activeTab === 'calendario' && <Calendario usuario_id={usuarioId} />}
          {activeTab === 'asistente' && <Asistente usuario_id={usuarioId} />}
        </div>
      </main>
    </>
  );
}
