import { useState, useEffect } from 'react';
import { useApi } from '../useApi';

export default function Dashboard({ usuarioId }) {
  const { get, loading, error } = useApi();
  const [usuario, setUsuario] = useState(null);
  const [turnos, setTurnos] = useState([]);
  const [medicinas, setMedicinas] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const userRes = await get(`/usuarios/${usuarioId}`);
        setUsuario(userRes.usuario);

        const turnosRes = await get(`/turnos?usuario_id=${usuarioId}`);
        setTurnos(turnosRes.slice(0, 3)); // Últimos 3

        const medicinasRes = await get(`/medicinas?usuario_id=${usuarioId}`);
        setMedicinas(medicinasRes.slice(0, 5)); // Primeras 5
      } catch (err) {
        console.error('Error loading dashboard:', err);
      }
    };

    if (usuarioId) loadData();
  }, [usuarioId, get]);

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (error) {
    return <div className="alert alert-error">Error: {error}</div>;
  }

  return (
    <div>
      {usuario && (
        <div className="card" style={{ marginBottom: '30px' }}>
          <h2>Hola, {usuario.nombre}</h2>
          <p style={{ marginTop: '5px', fontSize: '14px' }}>
            {usuario.tipo_usuario === 'titular' ? 'Titular' : 'Familiar'}
            {usuario.obra_social && ` • ${usuario.obra_social}`}
          </p>
        </div>
      )}

      {/* Próximos turnos */}
      <div style={{ marginBottom: '30px' }}>
        <h3 style={{ marginBottom: '15px' }}>Próximos turnos</h3>
        {turnos.length > 0 ? (
          <div className="list">
            {turnos.map((turno) => (
              <div key={turno.id} className="list-item">
                <div className="list-item-header">
                  <div className="list-item-title">{turno.especialidad}</div>
                  <span className="badge badge-info">{turno.tipo_atencion}</span>
                </div>
                <div className="list-item-meta">
                  <span>📅 {new Date(turno.fecha_turno).toLocaleDateString('es-AR')}</span>
                  <span>🕐 {turno.hora_turno}</span>
                  {turno.medico && <span>👨‍⚕️ {turno.medico}</span>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <h3>No hay turnos próximos</h3>
            <p>Agrega un nuevo turno para organizarte</p>
          </div>
        )}
      </div>

      {/* Medicinas activas */}
      <div>
        <h3 style={{ marginBottom: '15px' }}>Medicinas activas</h3>
        {medicinas.length > 0 ? (
          <div className="list">
            {medicinas.map((med) => (
              <div key={med.id} className="list-item">
                <div className="list-item-header">
                  <div>
                    <div className="list-item-title">{med.nombre_droga}</div>
                    <p style={{ fontSize: '12px', marginTop: '3px' }}>
                      {med.dosis} {med.unidad} • {med.frecuencia}
                    </p>
                  </div>
                  {med.fecha_fin && (
                    <span className="badge badge-warning">Termina {new Date(med.fecha_fin).toLocaleDateString('es-AR')}</span>
                  )}
                </div>
                <div className="list-item-meta">
                  {med.horario_1 && <span>🕐 {med.horario_1}</span>}
                  {med.horario_2 && <span>🕐 {med.horario_2}</span>}
                  {med.horario_3 && <span>🕐 {med.horario_3}</span>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <h3>No hay medicinas registradas</h3>
            <p>Agrega una medicina para mantenerla bajo control</p>
          </div>
        )}
      </div>
    </div>
  );
}
