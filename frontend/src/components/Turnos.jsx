import { useState, useEffect } from 'react';
import { useApi } from '../useApi';

export default function Turnos({ usuarioId }) {
  const { get, post, put, loading, error } = useApi();
  const [turnos, setTurnos] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [formData, setFormData] = useState({
    usuario_id: usuarioId,
    especialidad: '',
    medico: '',
    fecha_turno: '',
    hora_turno: '',
    lugar: '',
    obra_social: '',
    tipo_atencion: 'privada',
    alarma_7_dias: true,
    alarma_24_horas: true,
    alarma_1_hora: true
  });

  useEffect(() => {
    loadTurnos();
  }, [usuarioId]);

  const loadTurnos = async () => {
    try {
      const data = await get(`/turnos?usuario_id=${usuarioId}`);
      setTurnos(data);
    } catch (err) {
      console.error('Error loading turnos:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await post('/turnos', formData);
      setSuccessMsg('✓ Turno creado exitosamente');
      setFormData({
        usuario_id: usuarioId,
        especialidad: '',
        medico: '',
        fecha_turno: '',
        hora_turno: '',
        lugar: '',
        obra_social: '',
        tipo_atencion: 'privada',
        alarma_7_dias: true,
        alarma_24_horas: true,
        alarma_1_hora: true
      });
      setShowForm(false);
      await loadTurnos();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error('Error creating turno:', err);
    }
  };

  const handleMarcarAsistido = async (turnoId) => {
    try {
      await put(`/turnos/${turnoId}`, { asistido: true });
      setSuccessMsg('✓ Turno marcado como asistido');
      await loadTurnos();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error('Error updating turno:', err);
    }
  };

  if (loading && turnos.length === 0) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div>
      {successMsg && <div className="alert alert-success">{successMsg}</div>}
      {error && <div className="alert alert-error">Error: {error}</div>}

      <div style={{ marginBottom: '20px' }}>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? '✕ Cancelar' : '+ Nuevo turno'}
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: '30px' }}>
          <h3 style={{ marginBottom: '20px' }}>Crear nuevo turno</h3>
          <form onSubmit={handleSubmit} className="form">
            <div className="form-group">
              <label>Especialidad *</label>
              <input
                type="text"
                name="especialidad"
                placeholder="Cardiología, Oftalmología, etc"
                value={formData.especialidad}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Médico</label>
              <input
                type="text"
                name="medico"
                placeholder="Nombre del médico"
                value={formData.medico}
                onChange={handleChange}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div className="form-group">
                <label>Fecha *</label>
                <input
                  type="date"
                  name="fecha_turno"
                  value={formData.fecha_turno}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Hora *</label>
                <input
                  type="time"
                  name="hora_turno"
                  value={formData.hora_turno}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Lugar</label>
              <input
                type="text"
                name="lugar"
                placeholder="Consultorio, Hospital, Clínica..."
                value={formData.lugar}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Obra social / Prepaga</label>
              <input
                type="text"
                name="obra_social"
                placeholder="OSDE, Swiss Medical, etc"
                value={formData.obra_social}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Tipo de atención</label>
              <select name="tipo_atencion" value={formData.tipo_atencion} onChange={handleChange}>
                <option value="privada">Privada</option>
                <option value="prepaga">Prepaga</option>
                <option value="pública">Pública</option>
              </select>
            </div>

            <div style={{ padding: '15px', background: '#f0fdf4', borderRadius: '6px', marginBottom: '15px' }}>
              <p style={{ fontWeight: '500', marginBottom: '10px', fontSize: '14px' }}>Recordatorios automáticos</p>
              <div style={{ display: 'flex', gap: '15px', flexDirection: 'column' }}>
                <label style={{ display: 'flex', gap: '8px', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    name="alarma_7_dias"
                    checked={formData.alarma_7_dias}
                    onChange={handleChange}
                  />
                  <span style={{ fontSize: '14px' }}>Notificar 7 días antes</span>
                </label>
                <label style={{ display: 'flex', gap: '8px', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    name="alarma_24_horas"
                    checked={formData.alarma_24_horas}
                    onChange={handleChange}
                  />
                  <span style={{ fontSize: '14px' }}>Notificar 24h antes</span>
                </label>
                <label style={{ display: 'flex', gap: '8px', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    name="alarma_1_hora"
                    checked={formData.alarma_1_hora}
                    onChange={handleChange}
                  />
                  <span style={{ fontSize: '14px' }}>Notificar 1h antes</span>
                </label>
              </div>
            </div>

            <button type="submit" className="btn btn-primary">Guardar turno</button>
          </form>
        </div>
      )}

      {turnos.length > 0 ? (
        <div className="list">
          {turnos.map((turno) => (
            <div key={turno.id} className="list-item">
              <div className="list-item-header">
                <div>
                  <div className="list-item-title">{turno.especialidad}</div>
                  {turno.medico && <p style={{ fontSize: '12px', marginTop: '3px' }}>Dr/a. {turno.medico}</p>}
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {turno.asistido && <span className="badge badge-success">Asistido</span>}
                  <span className="badge" style={{
                    background: turno.tipo_atencion === 'pública' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                    color: turno.tipo_atencion === 'pública' ? '#3b82f6' : '#f59e0b'
                  }}>
                    {turno.tipo_atencion}
                  </span>
                </div>
              </div>

              <div className="list-item-meta" style={{ marginBottom: '10px' }}>
                <span>📅 {new Date(turno.fecha_turno).toLocaleDateString('es-AR')}</span>
                <span>🕐 {turno.hora_turno}</span>
                {turno.lugar && <span>📍 {turno.lugar}</span>}
                {turno.obra_social && <span>🏥 {turno.obra_social}</span>}
              </div>

              {turno.notas && (
                <p style={{ fontSize: '12px', color: 'var(--text-light)', marginBottom: '10px' }}>
                  📝 {turno.notas}
                </p>
              )}

              {!turno.asistido && (
                <button
                  className="btn btn-secondary btn-small"
                  onClick={() => handleMarcarAsistido(turno.id)}
                >
                  ✓ Marcar como asistido
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <h3>No hay turnos</h3>
          <p>Crea tu primer turno para organizarte</p>
        </div>
      )}
    </div>
  );
}
