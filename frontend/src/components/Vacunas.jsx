import { useState, useEffect } from 'react';
import { useApi } from '../useApi';

export default function Vacunas({ usuarioId }) {
  const { get, post, put, delete: apiDelete } = useApi();
  const [vacunas, setVacunas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [filtro, setFiltro] = useState('todas');
  const [form, setForm] = useState({
    usuario_id: usuarioId,
    nombre: '', fecha_aplicacion: '', fecha_proxima: '',
    dosis: '', numero_dosis: 1, total_dosis: '',
    laboratorio: '', lote: '', lugar_aplicacion: '',
    medico: '', estado: 'aplicada', notas: ''
  });

  useEffect(() => { cargar(); }, [usuarioId]);

  const cargar = async () => {
    const data = await get(`/vacunas/${usuarioId}`);
    setVacunas(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  const limpiar = () => {
    setForm({ usuario_id: usuarioId, nombre: '', fecha_aplicacion: '', fecha_proxima: '', dosis: '', numero_dosis: 1, total_dosis: '', laboratorio: '', lote: '', lugar_aplicacion: '', medico: '', estado: 'aplicada', notas: '' });
    setEditingId(null);
  };

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleGuardar = async () => {
    if (!form.nombre) return alert('El nombre es obligatorio');
    if (editingId) await put(`/vacunas/${editingId}`, form);
    else await post('/vacunas', form);
    cargar(); limpiar(); setShowForm(false);
  };

  const handleEditar = (v) => { setForm(v); setEditingId(v.id); setShowForm(true); };
  const handleEliminar = async (id) => { if (confirm('¿Eliminar?')) { await apiDelete(`/vacunas/${id}`); cargar(); } };

  const vFiltradas = filtro === 'todas' ? vacunas : vacunas.filter(v => v.estado === filtro);

  const getColor = (estado) => ({ aplicada: '#4caf50', pendiente: '#ff9800', vencida: '#f44336', completa: '#2196f3' }[estado] || '#999');

  if (loading) return <div style={{ padding: 20, textAlign: 'center' }}>Cargando...</div>;

  return (
    <div style={{ padding: 20 }}>
      <h2>💉 Vacunación</h2>

      {!showForm ? (
        <>
          <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
            <button onClick={() => { limpiar(); setShowForm(true); }} style={{ background: '#0066cc', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 5, cursor: 'pointer' }}>
              ➕ Agregar Vacuna
            </button>
            <select value={filtro} onChange={e => setFiltro(e.target.value)} style={{ padding: '10px', borderRadius: 5, border: '1px solid #ddd' }}>
              <option value="todas">Todas</option>
              <option value="aplicada">Aplicadas</option>
              <option value="pendiente">Pendientes</option>
              <option value="completa">Completas</option>
              <option value="vencida">Vencidas</option>
            </select>
          </div>

          {vFiltradas.length === 0 ? <p>Sin vacunas registradas</p> : vFiltradas.map(v => (
            <div key={v.id} style={{ background: '#f9f9f9', padding: 15, marginBottom: 10, borderRadius: 8, borderLeft: `4px solid ${getColor(v.estado)}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <h4 style={{ margin: '0 0 5px 0' }}>💉 {v.nombre}
                    <span style={{ marginLeft: 10, color: getColor(v.estado), fontSize: 13 }}>● {v.estado}</span>
                  </h4>
                  {v.fecha_aplicacion && <p style={{ margin: '3px 0' }}><strong>📅 Aplicada:</strong> {v.fecha_aplicacion}</p>}
                  {v.fecha_proxima && <p style={{ margin: '3px 0' }}><strong>📅 Próxima:</strong> {v.fecha_proxima}</p>}
                  {v.dosis && <p style={{ margin: '3px 0' }}><strong>Dosis:</strong> {v.numero_dosis}/{v.total_dosis || '?'} — {v.dosis}</p>}
                  {v.laboratorio && <p style={{ margin: '3px 0' }}><strong>Lab:</strong> {v.laboratorio}</p>}
                  {v.lugar_aplicacion && <p style={{ margin: '3px 0' }}><strong>Lugar:</strong> {v.lugar_aplicacion}</p>}
                  {v.notas && <p style={{ margin: '3px 0' }}><strong>Notas:</strong> {v.notas}</p>}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => handleEditar(v)} style={{ background: '#ff9800', color: 'white', border: 'none', padding: '8px 12px', borderRadius: 4, cursor: 'pointer' }}>✏️</button>
                  <button onClick={() => handleEliminar(v.id)} style={{ background: '#f44336', color: 'white', border: 'none', padding: '8px 12px', borderRadius: 4, cursor: 'pointer' }}>🗑️</button>
                </div>
              </div>
            </div>
          ))}
        </>
      ) : (
        <div style={{ background: '#fff', padding: 15, border: '1px solid #ddd', borderRadius: 8 }}>
          <h3>{editingId ? 'Editar Vacuna' : 'Nueva Vacuna'}</h3>

          {[['nombre', 'Nombre *', 'text', 'Ej: Triple viral, COVID-19, Gripe'],
            ['fecha_aplicacion', 'Fecha de Aplicación', 'date', ''],
            ['fecha_proxima', 'Fecha Próxima Dosis', 'date', ''],
            ['dosis', 'Dosis', 'text', 'Ej: 0.5ml'],
            ['laboratorio', 'Laboratorio', 'text', 'Ej: Pfizer, AstraZeneca'],
            ['lote', 'Lote', 'text', ''],
            ['lugar_aplicacion', 'Lugar de Aplicación', 'text', 'Ej: Hospital, Farmacia'],
            ['medico', 'Médico', 'text', '']
          ].map(([name, label, type, placeholder]) => (
            <div key={name} style={{ marginBottom: 10 }}>
              <label><strong>{label}</strong></label>
              <input type={type} name={name} value={form[name]} onChange={handleChange} placeholder={placeholder}
                style={{ width: '100%', padding: 8, boxSizing: 'border-box' }} />
            </div>
          ))}

          <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
            <div style={{ flex: 1 }}>
              <label><strong>Dosis N°</strong></label>
              <input type="number" name="numero_dosis" value={form.numero_dosis} onChange={handleChange} min="1"
                style={{ width: '100%', padding: 8 }} />
            </div>
            <div style={{ flex: 1 }}>
              <label><strong>Total Dosis</strong></label>
              <input type="number" name="total_dosis" value={form.total_dosis} onChange={handleChange} min="1"
                style={{ width: '100%', padding: 8 }} />
            </div>
          </div>

          <div style={{ marginBottom: 10 }}>
            <label><strong>Estado</strong></label>
            <select name="estado" value={form.estado} onChange={handleChange} style={{ width: '100%', padding: 8 }}>
              <option value="aplicada">Aplicada</option>
              <option value="pendiente">Pendiente</option>
              <option value="completa">Completa</option>
              <option value="vencida">Vencida</option>
            </select>
          </div>

          <div style={{ marginBottom: 15 }}>
            <label><strong>Notas</strong></label>
            <textarea name="notas" value={form.notas} onChange={handleChange}
              style={{ width: '100%', height: 60, padding: 8, boxSizing: 'border-box', fontFamily: 'Arial' }} />
          </div>

          <button onClick={handleGuardar} style={{ background: '#20c997', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 5, cursor: 'pointer', marginRight: 10 }}>💾 Guardar</button>
          <button onClick={() => { limpiar(); setShowForm(false); }} style={{ background: '#999', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 5, cursor: 'pointer' }}>❌ Cancelar</button>
        </div>
      )}
    </div>
  );
}
