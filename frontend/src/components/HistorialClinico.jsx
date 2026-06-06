import { useState, useEffect } from 'react';
import { useApi } from '../useApi';

const API_BASE = 'https://salud-app-backend.onrender.com';

export default function HistorialClinico({ usuario_id }) {
  const { get, post } = useApi();
  const [historial, setHistorial] = useState({});
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [archivos, setArchivos] = useState([]);
  const [archivoFile, setArchivoFile] = useState(null);
  const [archivoDesc, setArchivoDesc] = useState('');
  const [uploadMsg, setUploadMsg] = useState('');
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
    cargarArchivos();
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

  const cargarArchivos = async () => {
    try {
      const data = await get(`/archivos/${usuario_id}`);
      setArchivos(Array.isArray(data) ? data : []);
    } catch (e) {
      setArchivos([]);
    }
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

  const handleSubir = async () => {
    if (!archivoFile) return;
    const fd = new FormData();
    fd.append('archivo', archivoFile);
    fd.append('usuario_id', usuario_id);
    fd.append('descripcion', archivoDesc);
    await fetch(`${API_BASE}/api/archivos`, { method: 'POST', body: fd });
    setArchivoFile(null);
    setArchivoDesc('');
    setUploadMsg('✓ Archivo subido');
    cargarArchivos();
    setTimeout(() => setUploadMsg(''), 3000);
  };

  const handleEliminar = async (id) => {
    await fetch(`${API_BASE}/api/archivos/${id}`, { method: 'DELETE' });
    cargarArchivos();
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
          <button onClick={() => setIsEditing(true)} className="btn btn-primary">✏️ Editar</button>
        </div>
      ) : (
        <div style={{ background: '#fff', padding: '15px', border: '1px solid #ddd', borderRadius: '8px' }}>
          {[
            { name: 'resumen_general', label: 'Resumen General', tipo: 'textarea' },
            { name: 'alergias', label: 'Alergias (separadas por coma)', placeholder: 'Ej: Penicilina, polen' },
            { name: 'enfermedades_cronicas', label: 'Enfermedades Crónicas', placeholder: 'Ej: Diabetes, hipertensión' },
            { name: 'operaciones_previas', label: 'Operaciones Previas', placeholder: 'Ej: Apendicectomía 2005' },
            { name: 'hospitalizaciones', label: 'Hospitalizaciones', placeholder: 'Ej: Apéndice 2005' },
            { name: 'observaciones', label: 'Observaciones', tipo: 'textarea' },
          ].map(f => (
            <div key={f.name} style={{ marginBottom: '15px' }}>
              <label><strong>{f.label}:</strong></label>
              {f.tipo === 'textarea' ? (
                <textarea name={f.name} value={formData[f.name]} onChange={handleChange}
                  style={{ width: '100%', height: '80px', padding: '10px', fontFamily: 'Arial' }} />
              ) : (
                <input type="text" name={f.name} value={formData[f.name]} onChange={handleChange}
                  placeholder={f.placeholder} style={{ width: '100%', padding: '10px' }} />
              )}
            </div>
          ))}
          <button onClick={handleGuardar} className="btn btn-primary" style={{ marginRight: 10 }}>💾 Guardar</button>
          <button onClick={() => setIsEditing(false)} className="btn btn-secondary">❌ Cancelar</button>
        </div>
      )}

      <div style={{ marginTop: 30 }}>
        <h3>📎 Archivos adjuntos</h3>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', margin: '15px 0', alignItems: 'flex-end' }}>
          <input
            type="file"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.html,.jpg,.jpeg,.png,.webp"
            onChange={e => setArchivoFile(e.target.files[0])}
            style={{ flex: 1 }}
          />
          <input
            type="text"
            placeholder="Descripción (opcional)"
            value={archivoDesc}
            onChange={e => setArchivoDesc(e.target.value)}
            className="form-input"
            style={{ flex: 1 }}
          />
          <button className="btn btn-primary" onClick={handleSubir}>Subir</button>
        </div>
        {uploadMsg && <p style={{ color: 'green' }}>{uploadMsg}</p>}
        {archivos.length > 0 ? (
          <div className="list">
            {archivos.map(a => (
              <div key={a.id} className="list-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div className="list-item-title">{a.nombre_original}</div>
                  {a.descripcion && <p style={{ fontSize: 12, color: '#666' }}>{a.descripcion}</p>}
                  <p style={{ fontSize: 11, color: '#999' }}>{new Date(a.created_at).toLocaleDateString('es-AR')}</p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <a href={`${API_BASE}/api/archivos/download/${a.nombre_archivo}`}
                    className="btn btn-secondary btn-small" download={a.nombre_original}>
                    ⬇ Descargar
                  </a>
                  <button className="btn btn-danger btn-small" onClick={() => handleEliminar(a.id)}>🗑</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: '#999' }}>Sin archivos adjuntos</p>
        )}
      </div>
    </div>
  );
}