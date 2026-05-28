import { useState, useEffect } from 'react';
import { useApi } from '../useApi';

export default function HistorialClinico({ usuario_id }) {
  const { get, post } = useApi();
  const [historial, setHistorial] = useState({});
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    usuario_id,
    resumen_general: '',
    alergias: '',
    enfermedades_cronicas: '',
    operaciones_previas: '',
    hospitalizaciones: '',
    observaciones: ''
  });

  useEffect(() => {
    cargarHistorial();
  }, [usuario_id]);

  const cargarHistorial = async () => {
    const data = await get(`/historiales/${usuario_id}`);
    setHistorial(data);
    setFormData({
      usuario_id,
      resumen_general: data.resumen_general || '',
      alergias: data.alergias || '',
      enfermedades_cronicas: data.enfermedades_cronicas || '',
      operaciones_previas: data.operaciones_previas || '',
      hospitalizaciones: data.hospitalizaciones || '',
      observaciones: data.observaciones || ''
    });
    setLoading(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleGuardar = async () => {
    await post('/historiales', formData);
    cargarHistorial();
    setIsEditing(false);
  };

  if (loading) return <div style={{ padding: '20px', textAlign: 'center' }}>Cargando...</div>;

  return (
    <div style={{ padding: '20px' }}>
      <h2>📋 Historial Clínico</h2>

      {!isEditing ? (
        <div style={{ background: '#f5f5f5', padding: '15px', borderRadius: '8px' }}>
          <div style={{ marginBottom: '15px' }}>
            <strong>📝 Resumen General:</strong>
            <p>{historial.resumen_general || 'Sin datos'}</p>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <strong>⚠️ Alergias:</strong>
            <p>{historial.alergias || 'Sin datos'}</p>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <strong>🏥 Enfermedades Crónicas:</strong>
            <p>{historial.enfermedades_cronicas || 'Sin datos'}</p>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <strong>🏨 Operaciones Previas:</strong>
            <p>{historial.operaciones_previas || 'Sin datos'}</p>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <strong>🛏️ Hospitalizaciones:</strong>
            <p>{historial.hospitalizaciones || 'Sin datos'}</p>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <strong>📌 Observaciones:</strong>
            <p>{historial.observaciones || 'Sin datos'}</p>
          </div>

          <button 
            onClick={() => setIsEditing(true)}
            style={{
              background: '#20c997',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            ✏️ Editar
          </button>
        </div>
      ) : (
        <div style={{ background: '#fff', padding: '15px', border: '1px solid #ddd', borderRadius: '8px' }}>
          <div style={{ marginBottom: '15px' }}>
            <label><strong>Resumen General:</strong></label>
            <textarea
              name="resumen_general"
              value={formData.resumen_general}
              onChange={handleChange}
              style={{ width: '100%', height: '80px', padding: '10px', fontFamily: 'Arial' }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label><strong>Alergias (separadas por coma):</strong></label>
            <input
              type="text"
              name="alergias"
              value={formData.alergias}
              onChange={handleChange}
              placeholder="Ej: Penicilina, polen, lácteos"
              style={{ width: '100%', padding: '10px' }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label><strong>Enfermedades Crónicas:</strong></label>
            <input
              type="text"
              name="enfermedades_cronicas"
              value={formData.enfermedades_cronicas}
              onChange={handleChange}
              placeholder="Ej: Diabetes, hipertensión"
              style={{ width: '100%', padding: '10px' }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label><strong>Operaciones Previas:</strong></label>
            <input
              type="text"
              name="operaciones_previas"
              value={formData.operaciones_previas}
              onChange={handleChange}
              placeholder="Ej: Apendicectomía 2005"
              style={{ width: '100%', padding: '10px' }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label><strong>Hospitalizaciones:</strong></label>
            <input
              type="text"
              name="hospitalizaciones"
              value={formData.hospitalizaciones}
              onChange={handleChange}
              placeholder="Ej: Apéndice 2005, Cesárea 2015"
              style={{ width: '100%', padding: '10px' }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label><strong>Observaciones:</strong></label>
            <textarea
              name="observaciones"
              value={formData.observaciones}
              onChange={handleChange}
              style={{ width: '100%', height: '80px', padding: '10px', fontFamily: 'Arial' }}
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
            onClick={() => setIsEditing(false)}
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
