import { useState, useEffect } from 'react';
import { useApi } from '../useApi';

export default function CondicionesMedicas({ usuario_id }) {
  const { get, post, put, delete: apiDelete } = useApi();
  const [condiciones, setCondiciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [filtro, setFiltro] = useState('todas');
  const [formData, setFormData] = useState({
    usuario_id,
    tipo: 'enfermedad',
    nombre: '',
    descripcion: '',
    fecha_diagnostico: '',
    fecha_operacion: '',
    estado: 'activa',
    tratamiento: '',
    medico_responsable: '',
    hospital_clinica: '',
    observaciones: ''
  });

  useEffect(() => {
    cargarCondiciones();
  }, [usuario_id]);

  const cargarCondiciones = async () => {
    const data = await get(`/condiciones/${usuario_id}`);
    setCondiciones(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const limpiarForm = () => {
    setFormData({
      usuario_id,
      tipo: 'enfermedad',
      nombre: '',
      descripcion: '',
      fecha_diagnostico: '',
      fecha_operacion: '',
      estado: 'activa',
      tratamiento: '',
      medico_responsable: '',
      hospital_clinica: '',
      observaciones: ''
    });
    setEditingId(null);
  };

  const handleGuardar = async () => {
    if (!formData.nombre) {
      alert('El nombre es obligatorio');
      return;
    }

    if (editingId) {
      await put(`/condiciones/${editingId}`, formData);
    } else {
      await post('/condiciones', formData);
    }

    cargarCondiciones();
    limpiarForm();
    setShowForm(false);
  };

  const handleEditar = (condicion) => {
    setFormData(condicion);
    setEditingId(condicion.id);
    setShowForm(true);
  };

  const handleEliminar = async (id) => {
    if (confirm('¿Eliminar esta condición?')) {
      await apiDelete(`/condiciones/${id}`);
      cargarCondiciones();
    }
  };

  const condicionesFiltradas = filtro === 'todas' 
    ? condiciones 
    : condiciones.filter(c => c.tipo === filtro);

  const getIcono = (tipo) => {
    const iconos = { enfermedad: '🏥', alergia: '⚠️', operacion: '🏨' };
    return iconos[tipo] || '📋';
  };

  if (loading) return <div style={{ padding: '20px', textAlign: 'center' }}>Cargando...</div>;

  return (
    <div style={{ padding: '20px' }}>
      <h2>🏥 Condiciones Médicas</h2>

      {!showForm ? (
        <div>
          <div style={{ marginBottom: '15px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button 
              onClick={() => {
                limpiarForm();
                setShowForm(true);
              }}
              style={{
                background: '#0066cc',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              ➕ Agregar Condición
            </button>

            <select 
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              style={{
                padding: '10px',
                borderRadius: '5px',
                border: '1px solid #ddd'
              }}
            >
              <option value="todas">Todas</option>
              <option value="enfermedad">Enfermedades</option>
              <option value="alergia">Alergias</option>
              <option value="operacion">Operaciones</option>
            </select>
          </div>

          {condicionesFiltradas.length === 0 ? (
            <p>Sin condiciones registradas</p>
          ) : (
            <div>
              {condicionesFiltradas.map(cond => (
                <div key={cond.id} style={{
                  background: '#f5f5f5',
                  padding: '15px',
                  marginBottom: '10px',
                  borderRadius: '8px',
                  borderLeft: cond.tipo === 'alergia' ? '4px solid #f44336' : cond.tipo === 'operacion' ? '4px solid #2196f3' : '4px solid #4caf50'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ margin: '0 0 5px 0' }}>
                        {getIcono(cond.tipo)} {cond.nombre}
                        {cond.estado === 'activa' && <span style={{ marginLeft: '10px', color: '#f44336' }}>● Activa</span>}
                        {cond.estado === 'controlada' && <span style={{ marginLeft: '10px', color: '#ff9800' }}>● Controlada</span>}
                        {cond.estado === 'resuelta' && <span style={{ marginLeft: '10px', color: '#4caf50' }}>● Resuelta</span>}
                      </h4>

                      {cond.descripcion && <p><strong>Descripción:</strong> {cond.descripcion}</p>}

                      {cond.tipo === 'enfermedad' && cond.fecha_diagnostico && (
                        <p><strong>📅 Diagnóstico:</strong> {cond.fecha_diagnostico}</p>
                      )}

                      {cond.tipo === 'operacion' && cond.fecha_operacion && (
                        <p><strong>📅 Fecha:</strong> {cond.fecha_operacion}</p>
                      )}

                      {cond.tratamiento && <p><strong>💊 Tratamiento:</strong> {cond.tratamiento}</p>}
                      {cond.medico_responsable && <p><strong>👨‍⚕️ Médico:</strong> {cond.medico_responsable}</p>}
                      {cond.hospital_clinica && <p><strong>🏥 Hospital/Clínica:</strong> {cond.hospital_clinica}</p>}
                      {cond.observaciones && <p><strong>📝 Observaciones:</strong> {cond.observaciones}</p>}
                    </div>
                    <div style={{ display: 'flex', gap: '10px', marginLeft: '10px' }}>
                      <button 
                        onClick={() => handleEditar(cond)}
                        style={{
                          background: '#ff9800',
                          color: 'white',
                          border: 'none',
                          padding: '8px 12px',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        ✏️
                      </button>
                      <button 
                        onClick={() => handleEliminar(cond.id)}
                        style={{
                          background: '#f44336',
                          color: 'white',
                          border: 'none',
                          padding: '8px 12px',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div style={{ background: '#fff', padding: '15px', border: '1px solid #ddd', borderRadius: '8px' }}>
          <h3>{editingId ? 'Editar Condición' : 'Nueva Condición'}</h3>

          <div style={{ marginBottom: '10px' }}>
            <label><strong>Tipo *</strong></label>
            <select
              name="tipo"
              value={formData.tipo}
              onChange={handleChange}
              style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
            >
              <option value="enfermedad">Enfermedad</option>
              <option value="alergia">Alergia</option>
              <option value="operacion">Operación</option>
            </select>
          </div>

          <div style={{ marginBottom: '10px' }}>
            <label><strong>Nombre *</strong></label>
            <input
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              placeholder="Ej: Diabetes, Penicilina, Apendicectomía"
              style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ marginBottom: '10px' }}>
            <label><strong>Descripción</strong></label>
            <textarea
              name="descripcion"
              value={formData.descripcion}
              onChange={handleChange}
              style={{ width: '100%', height: '60px', padding: '8px', boxSizing: 'border-box', fontFamily: 'Arial' }}
            />
          </div>

          {formData.tipo !== 'operacion' && (
            <div style={{ marginBottom: '10px' }}>
              <label><strong>Fecha de Diagnóstico</strong></label>
              <input
                type="date"
                name="fecha_diagnostico"
                value={formData.fecha_diagnostico}
                onChange={handleChange}
                style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
              />
            </div>
          )}

          {formData.tipo === 'operacion' && (
            <div style={{ marginBottom: '10px' }}>
              <label><strong>Fecha de Operación</strong></label>
              <input
                type="date"
                name="fecha_operacion"
                value={formData.fecha_operacion}
                onChange={handleChange}
                style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
              />
            </div>
          )}

          <div style={{ marginBottom: '10px' }}>
            <label><strong>Estado</strong></label>
            <select
              name="estado"
              value={formData.estado}
              onChange={handleChange}
              style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
            >
              <option value="activa">Activa</option>
              <option value="controlada">Controlada</option>
              <option value="curada">Curada</option>
              <option value="resuelta">Resuelta</option>
            </select>
          </div>

          <div style={{ marginBottom: '10px' }}>
            <label><strong>Tratamiento</strong></label>
            <input
              type="text"
              name="tratamiento"
              value={formData.tratamiento}
              onChange={handleChange}
              placeholder="Ej: Metformina 500mg 2x diaria"
              style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ marginBottom: '10px' }}>
            <label><strong>Médico Responsable</strong></label>
            <input
              type="text"
              name="medico_responsable"
              value={formData.medico_responsable}
              onChange={handleChange}
              placeholder="Dr./Dra."
              style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ marginBottom: '10px' }}>
            <label><strong>Hospital/Clínica</strong></label>
            <input
              type="text"
              name="hospital_clinica"
              value={formData.hospital_clinica}
              onChange={handleChange}
              style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label><strong>Observaciones</strong></label>
            <textarea
              name="observaciones"
              value={formData.observaciones}
              onChange={handleChange}
              style={{ width: '100%', height: '60px', padding: '8px', boxSizing: 'border-box', fontFamily: 'Arial' }}
            />
          </div>

          <button 
            onClick={handleGuardar}
            style={{
              background: '#20c997',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '5px',
              cursor: 'pointer',
              marginRight: '10px'
            }}
          >
            💾 Guardar
          </button>

          <button 
            onClick={() => {
              limpiarForm();
              setShowForm(false);
            }}
            style={{
              background: '#999',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            ❌ Cancelar
          </button>
        </div>
      )}
    </div>
  );
}
