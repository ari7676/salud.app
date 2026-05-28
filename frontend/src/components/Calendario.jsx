import { useState, useEffect } from 'react';
import { useApi } from '../useApi';

export default function Calendario({ usuarioId }) {
  const { get } = useApi();
  const [turnos, setTurnos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { cargar(); }, [usuarioId]);

  const cargar = async () => {
    const data = await get(`/turnos?usuario_id=${usuarioId}`);
    const hoy = new Date().toISOString().split('T')[0];
    const proximos = (Array.isArray(data) ? data : []).filter(t => t.fecha_turno >= hoy && !t.asistido);
    setTurnos(proximos);
    setLoading(false);
  };

  const generarLinkCalendario = (turno) => {
    const fecha = turno.fecha_turno.replace(/-/g, '');
    const hora = turno.hora_turno ? turno.hora_turno.replace(':', '') : '0900';
    const horaFin = turno.hora_turno ? String(parseInt(hora) + 100).padStart(4, '0') : '1000';

    const titulo = encodeURIComponent(`Turno ${turno.especialidad}${turno.medico ? ` - ${turno.medico}` : ''}`);
    const lugar = encodeURIComponent(turno.lugar || '');
    const descripcion = encodeURIComponent(
      `Especialidad: ${turno.especialidad}\n` +
      (turno.medico ? `Médico: ${turno.medico}\n` : '') +
      (turno.obra_social ? `Obra Social: ${turno.obra_social}\n` : '') +
      (turno.notas ? `Notas: ${turno.notas}` : '')
    );

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${titulo}&dates=${fecha}T${hora}00/${fecha}T${horaFin}00&details=${descripcion}&location=${lugar}`;
  };

  const generarLinkOutlook = (turno) => {
    const fecha = turno.fecha_turno;
    const hora = turno.hora_turno || '09:00';
    const titulo = encodeURIComponent(`Turno ${turno.especialidad}`);
    return `https://outlook.live.com/calendar/0/deeplink/compose?subject=${titulo}&startdt=${fecha}T${hora}:00`;
  };

  if (loading) return <div style={{ padding: 20, textAlign: 'center' }}>Cargando...</div>;

  return (
    <div style={{ padding: 20 }}>
      <h2>📅 Calendario</h2>
      <p style={{ color: '#666', marginBottom: 20 }}>Agrega tus próximos turnos a Google Calendar o Outlook con un click.</p>

      {turnos.length === 0 ? (
        <div style={{ background: '#f5f5f5', padding: 20, borderRadius: 8, textAlign: 'center' }}>
          <p>No hay turnos próximos pendientes.</p>
          <p style={{ color: '#666', fontSize: 14 }}>Crea un turno en el módulo "Turnos" para verlo aquí.</p>
        </div>
      ) : (
        <div>
          {turnos.map(turno => (
            <div key={turno.id} style={{ background: '#f0f8ff', padding: 15, marginBottom: 15, borderRadius: 8, border: '1px solid #b3d9ff' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <h4 style={{ margin: '0 0 8px 0' }}>📋 {turno.especialidad}</h4>
                  {turno.medico && <p style={{ margin: '3px 0' }}>👨‍⚕️ {turno.medico}</p>}
                  <p style={{ margin: '3px 0' }}>📅 {turno.fecha_turno} — {turno.hora_turno}</p>
                  {turno.lugar && <p style={{ margin: '3px 0' }}>📍 {turno.lugar}</p>}
                  {turno.obra_social && <p style={{ margin: '3px 0' }}>🏥 {turno.obra_social}</p>}
                </div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <a
                    href={generarLinkCalendario(turno)}
                    target="_blank"
                    rel="noreferrer"
                    style={{ background: '#4285f4', color: 'white', padding: '10px 15px', borderRadius: 5, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 5 }}
                  >
                    📅 Google Calendar
                  </a>
                  <a
                    href={generarLinkOutlook(turno)}
                    target="_blank"
                    rel="noreferrer"
                    style={{ background: '#0078d4', color: 'white', padding: '10px 15px', borderRadius: 5, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 5 }}
                  >
                    📅 Outlook
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: 30, background: '#fff8e1', padding: 15, borderRadius: 8, border: '1px solid #ffc107' }}>
        <h4 style={{ margin: '0 0 8px 0' }}>💡 ¿Cómo funciona?</h4>
        <p style={{ margin: 0, fontSize: 14, color: '#666' }}>
          Click en "Google Calendar" o "Outlook" para abrir el evento pre-cargado. 
          Solo tenés que confirmar y el turno se agrega a tu calendario.
        </p>
      </div>
    </div>
  );
}
