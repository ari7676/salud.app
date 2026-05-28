import { useState, useEffect } from 'react';
import { useApi } from '../useApi';

export default function Prepaga({ usuarioId }) {
  const { get, post, put, delete: apiDelete } = useApi();
  const [prepagas, setPrepagas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    usuario_id: usuarioId,
    nombre: '', plan: '', numero_afiliado: '',
    telefono: '', telefono_emergencias: '',
    email: '', web: '', app_link: '',
    vencimiento_carnet: '', observaciones: ''
  });

  useEffect(() => { cargar(); }, [usuarioId]);

  const cargar = async () => {
    const data = await get(`/prepagas/${usuarioId}`);
    setPrepagas(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  const limpiar = () => {
    setForm({ usuario_id: usuarioId, nombre: '', plan: '', numero_afiliado: '', telefono: '', telefono_emergencias: '', email: '', web: '', app_link: '', vencimiento_carnet: '', observaciones: '' });
    setEditingId(null);
  };

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleGuardar = async () => {
    if (!form.nombre) return alert('El nombre es obligatorio');
    if (editingId) await put(`/prepagas/${editingId}`, form);
    else await post('/prepagas', form);
    cargar(); limpiar(); setShowForm(false);
  };

  const handleEditar = (p) => { setForm(p); setEditingId(p.id); setShowForm(true); };
  const handleEliminar = async (id) => { if (confirm('¿Eliminar?')) { await apiDelete(`/prepagas/${id}`); cargar(); } };

  if (loading) return <div style={{ padding: 20, textAlign: 'center' }}>Cargando...</div>;

  return (
    <div style={{ padding: 20 }}>
      <h2>🏥 Prepaga / Obra Social</h2>

      {!showForm ? (
        <>
          <button onClick={() => { limpiar(); setShowForm(true); }} style={{ background: '#0066cc', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 5, cursor: 'pointer', marginBottom: 20 }}>
            ➕ Agregar Prepaga
          </button>

          {prepagas.length === 0 ? <p>Sin prepagas registradas</p> : prepagas.map(p => (
            <div key={p.id} style={{ background: '#f0f8ff', padding: 20, marginBottom: 15, borderRadius: 8, border: '2px solid #0066cc' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: '0 0 10px 0' }}>🏥 {p.nombre} {p.plan && `— ${p.plan}`}</h3>
                  {p.numero_afiliado && (
                    <p style={{ margin: '5px 0', fontSize: 16 }}>
                      <strong>👤 N° Afiliado:</strong> <span style={{ fontFamily: 'monospace', fontSize: 18, background: '#e8f4fd', padding: '2px 8px', borderRadius: 4 }}>{p.numero_afiliado}</span>
                    </p>
                  )}

                  <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginTop: 10 }}>
                    {p.telefono && (
                      <a href={`tel:${p.telefono}`} style={{ color: '#0066cc', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 5 }}>
                        📞 {p.telefono}
                      </a>
                    )}
                    {p.telefono_emergencias && (
                      <a href={`tel:${p.telefono_emergencias}`} style={{ color: '#f44336', textDecoration: 'none', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 5 }}>
                        🚨 Emergencias: {p.telefono_emergencias}
                      </a>
                    )}
                    {p.email && (
                      <a href={`mailto:${p.email}`} style={{ color: '#0066cc', textDecoration: 'none' }}>
                        📧 {p.email}
                      </a>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 10 }}>
                    {p.web && (
                      <a href={p.web} target="_blank" rel="noreferrer" style={{ background: '#0066cc', color: 'white', padding: '8px 15px', borderRadius: 5, textDecoration: 'none' }}>
                        🌐 Sitio Web
                      </a>
                    )}
                    {p.app_link && (
                      <a href={p.app_link} target="_blank" rel="noreferrer" style={{ background: '#20c997', color: 'white', padding: '8px 15px', borderRadius: 5, textDecoration: 'none' }}>
                        📱 App
                      </a>
                    )}
                  </div>

                  {p.vencimiento_carnet && <p style={{ margin: '10px 0 0 0' }}><strong>📅 Vencimiento carnet:</strong> {p.vencimiento_carnet}</p>}
                  {p.observaciones && <p style={{ margin: '5px 0' }}><strong>📝 Notas:</strong> {p.observaciones}</p>}
                </div>
                <div style={{ display: 'flex', gap: 8, marginLeft: 10 }}>
                  <button onClick={() => handleEditar(p)} style={{ background: '#ff9800', color: 'white', border: 'none', padding: '8px 12px', borderRadius: 4, cursor: 'pointer' }}>✏️</button>
                  <button onClick={() => handleEliminar(p.id)} style={{ background: '#f44336', color: 'white', border: 'none', padding: '8px 12px', borderRadius: 4, cursor: 'pointer' }}>🗑️</button>
                </div>
              </div>
            </div>
          ))}
        </>
      ) : (
        <div style={{ background: '#fff', padding: 15, border: '1px solid #ddd', borderRadius: 8 }}>
          <h3>{editingId ? 'Editar Prepaga' : 'Nueva Prepaga'}</h3>

          {[['nombre', 'Nombre *', 'text', 'Ej: OSDE, Swiss Medical, IOMA'],
            ['plan', 'Plan', 'text', 'Ej: Plan 210, Plan 410'],
            ['numero_afiliado', 'N° Afiliado', 'text', ''],
            ['telefono', 'Teléfono Central', 'tel', 'Ej: 0800-333-6733'],
            ['telefono_emergencias', 'Teléfono Emergencias', 'tel', 'Ej: 107'],
            ['email', 'Email', 'email', ''],
            ['web', 'Sitio Web', 'url', 'https://www.osde.com.ar'],
            ['app_link', 'Link App', 'url', 'https://...'],
            ['vencimiento_carnet', 'Vencimiento Carnet', 'date', '']
          ].map(([name, label, type, placeholder]) => (
            <div key={name} style={{ marginBottom: 10 }}>
              <label><strong>{label}</strong></label>
              <input type={type} name={name} value={form[name]} onChange={handleChange} placeholder={placeholder}
                style={{ width: '100%', padding: 8, boxSizing: 'border-box' }} />
            </div>
          ))}

          <div style={{ marginBottom: 15 }}>
            <label><strong>Observaciones</strong></label>
            <textarea name="observaciones" value={form.observaciones} onChange={handleChange}
              style={{ width: '100%', height: 60, padding: 8, boxSizing: 'border-box', fontFamily: 'Arial' }} />
          </div>

          <button onClick={handleGuardar} style={{ background: '#20c997', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 5, cursor: 'pointer', marginRight: 10 }}>💾 Guardar</button>
          <button onClick={() => { limpiar(); setShowForm(false); }} style={{ background: '#999', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 5, cursor: 'pointer' }}>❌ Cancelar</button>
        </div>
      )}
    </div>
  );
}
