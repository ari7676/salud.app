import { useState, useEffect } from 'react';
import { useApi } from '../useApi';

function calcularEdad(fechaNacimiento) {
  if (!fechaNacimiento) return null;
  const hoy = new Date();
  const nac = new Date(fechaNacimiento);
  let edad = hoy.getFullYear() - nac.getFullYear();
  const m = hoy.getMonth() - nac.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
  return edad;
}

export default function Dashboard({ usuarioId }) {
  const { get, post, put, loading } = useApi();
  const [usuario, setUsuario] = useState(null);
  const [turnos, setTurnos] = useState([]);
  const [medicinas, setMedicinas] = useState([]);
  const [editando, setEditando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [form, setForm] = useState({});
  const [mensaje, setMensaje] = useState('');

  const loadData = async () => {
    try {
      const userRes = await get(`/usuarios/${usuarioId}`);
      setUsuario(userRes.usuario);
      setForm({
        nombre: userRes.usuario.nombre || '',
        fecha_nacimiento: userRes.usuario.fecha_nacimiento || '',
        telefono: userRes.usuario.telefono || '',
        localidad: userRes.usuario.localidad || '',
        cobertura: userRes.usuario.obra_social ? 'prepaga' : (userRes.usuario.salud_publica ? 'publica' : 'ninguna'),
        obra_social: userRes.usuario.obra_social || '',
        plan: userRes.usuario.plan || '',
      });
      const turnosRes = await get(`/turnos?usuario_id=${usuarioId}`);
      setTurnos(turnosRes.slice(0, 3));
      const medicinasRes = await get(`/medicinas?usuario_id=${usuarioId}`);
      setMedicinas(medicinasRes.slice(0, 5));
    } catch (err) {
      console.error('Error loading dashboard:', err);
    }
  };

  useEffect(() => {
    if (usuarioId) loadData();
  }, [usuarioId]);

  const handleGuardar = async () => {
    setGuardando(true);
    try {
      const data = {
        nombre: form.nombre,
        fecha_nacimiento: form.fecha_nacimiento || null,
        telefono: form.telefono || null,
        localidad: form.localidad || null,
        obra_social: form.cobertura === 'prepaga' ? form.obra_social : null,
        plan: form.cobertura === 'prepaga' ? form.plan : null,
        salud_publica: form.cobertura === 'publica' ? 1 : 0,
      };
      await put(`/usuarios/${usuarioId}`, data);
      setMensaje('Perfil actualizado ✓');
      setEditando(false);
      await loadData();
      setTimeout(() => setMensaje(''), 3000);
    } catch (err) {
      setMensaje('Error al guardar');
    } finally {
      setGuardando(false);
    }
  };

  if (loading && !usuario) {
    return <div className="loading"><div className="spinner"></div></div>;
  }

  const edad = calcularEdad(usuario?.fecha_nacimiento);

  return (
    <div>
      {/* Card perfil */}
      <div className="card" style={{ marginBottom: '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2>Hola, {usuario?.nombre}</h2>
            <p style={{ marginTop: '5px', fontSize: '14px', color: '#666' }}>
              {usuario?.tipo_usuario === 'titular' ? 'Titular' : 'Familiar'}
              {edad !== null && ` • ${edad} años`}
              {usuario?.localidad && ` • ${usuario.localidad}`}
            </p>
            {usuario?.telefono && (
              <p style={{ fontSize: '13px', color: '#888', marginTop: '3px' }}>📞 {usuario.telefono}</p>
            )}
            {usuario?.obra_social && (
              <p style={{ fontSize: '13px', color: '#888', marginTop: '3px' }}>
                🏥 {usuario.obra_social}{usuario.plan ? ` — Plan ${usuario.plan}` : ''}
              </p>
            )}
            {usuario?.salud_publica === 1 && (
              <p style={{ fontSize: '13px', color: '#888', marginTop: '3px' }}>🏥 Salud pública</p>
            )}
          </div>
          <button
            className="btn btn-secondary"
            style={{ fontSize: '13px', padding: '6px 14px' }}
            onClick={() => setEditando(!editando)}
          >
            {editando ? 'Cancelar' : 'Editar perfil'}
          </button>
        </div>

        {mensaje && (
          <div className={`alert ${mensaje.includes('Error') ? 'alert-error' : 'alert-success'}`} style={{ marginTop: '15px' }}>
            {mensaje}
          </div>
        )}

        {editando && (
          <div style={{ marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div className="form-group">
                <label className="form-label">Nombre completo</label>
                <input
                  className="form-input"
                  value={form.nombre}
                  onChange={e => setForm({ ...form, nombre: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Fecha de nacimiento</label>
                <input
                  type="date"
                  className="form-input"
                  value={form.fecha_nacimiento}
                  onChange={e => setForm({ ...form, fecha_nacimiento: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Teléfono</label>
                <input
                  className="form-input"
                  placeholder="Ej: 11-1234-5678"
                  value={form.telefono}
                  onChange={e => setForm({ ...form, telefono: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Localidad</label>
                <input
                  className="form-input"
                  placeholder="Ej: Buenos Aires"
                  value={form.localidad}
                  onChange={e => setForm({ ...form, localidad: e.target.value })}
                />
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Cobertura médica</label>
                <select
                  className="form-input"
                  value={form.cobertura}
                  onChange={e => setForm({ ...form, cobertura: e.target.value })}
                >
                  <option value="ninguna">Sin cobertura</option>
                  <option value="prepaga">Prepaga / Obra Social</option>
                  <option value="publica">Salud pública</option>
                </select>
              </div>
              {form.cobertura === 'prepaga' && (
                <>
                  <div className="form-group">
                    <label className="form-label">Prepaga / Obra Social</label>
                    <input
                      className="form-input"
                      placeholder="Ej: OSDE, Swiss Medical..."
                      value={form.obra_social}
                      onChange={e => setForm({ ...form, obra_social: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Plan</label>
                    <input
                      className="form-input"
                      placeholder="Ej: 210, Bronce..."
                      value={form.plan}
                      onChange={e => setForm({ ...form, plan: e.target.value })}
                    />
                  </div>
                </>
              )}
            </div>
            <button
              className="btn btn-primary"
              style={{ marginTop: '15px' }}
              onClick={handleGuardar}
              disabled={guardando}
            >
              {guardando ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        )}
      </div>

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
                    <span className="badge badge-warning">
                      Termina {new Date(med.fecha_fin).toLocaleDateString('es-AR')}
                    </span>
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