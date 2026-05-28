import { useState, useEffect } from 'react';
import { useApi } from '../useApi';

export default function ContactosEmergencia({ usuario_id }) {
  const { get, post, put, delete: apiDelete } = useApi();
  const [contactos, setContactos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    usuario_id,
    nombre: '',
    relacion: '',
    telefono: '',
    telefono_alternativo: '',
    email: '',
    direccion: '',
    disponibilidad: '',
    notas: '',
    es_principal: false
  });

  useEffect(() => {
    cargarContactos();
  }, [usuario_id]);

  const cargarContactos = async () => {
    const data = await get(`/contactos/${usuario_id}`);
    setContactos(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const limpiarForm = () => {
    setFormData({
      usuario_id,
      nombre: '',
      relacion: '',
      telefono: '',
      telefono_alternativo: '',
      email: '',
      direccion: '',
      disponibilidad: '',
      notas: '',
      es_principal: false
    });
    setEditingId(null);
  };

  const handleGuardar = async () => {
    if (!formData.nombre || !formData.telefono) {
      alert('Nombre y teléfono son obligatorios');
      return;
    }

    if (editingId) {
      await put(`/contactos/${editingId}`, formData);
    } else {
      await post('/contactos', formData);
    }

    cargarContactos();
    limpiarForm();
    setShowForm(false);
  };

  const handleEditar = (contacto) => {
    setFormData(contacto);
    setEditingId(contacto.id);
    setShowForm(true);
  };

  const handleEliminar = async (id) => {
    if (confirm('¿Eliminar este contacto?')) {
      await apiDelete(`/contactos/${id}`);
      cargarContactos();
    }
  };

  if (loading) return <div style={{ padding: '20px', textAlign: 'center' }}>Cargando...</div>;

  return (
    <div style={{ padding: '20px' }}>
      <h2>📞 Contactos de Emergencia</h2>

      {!showForm ? (
        <div>
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
              cursor: 'pointer',
              marginBottom: '20px'
            }}
          >
            ➕ Agregar Contacto
          </button>

          <div>
            {contactos.length === 0 ? (
              <p>Sin contactos registrados</p>
            ) : (
              contactos.map(contacto => (
                <div key={contacto.id} style={{
                  background: contacto.es_principal ? '#e8f5e9' : '#f5f5f5',
                  padding: '15px',
                  marginBottom: '10px',
                  borderRadius: '8px',
                  border: contacto.es_principal ? '2px solid #4caf50' : '1px solid #ddd'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ margin: '0 0 5px 0' }}>
                        {contacto.es_principal ? '⭐ ' : ''}{contacto.nombre}
                      </h4>
                      {contacto.relacion && <p><strong>Relación:</strong> {contacto.relacion}</p>}
                      <p><strong>📱 Teléfono:</strong> {contacto.telefono}</p>
                      {contacto.telefono_alternativo && <p><strong>📱 Alt:</strong> {contacto.telefono_alternativo}</p>}
                      {contacto.email && <p><strong>📧 Email:</strong> {contacto.email}</p>}
                      {contacto.disponibilidad && <p><strong>⏰ Disponibilidad:</strong> {contacto.disponibilidad}</p>}
                      {contacto.notas && <p><strong>📝 Notas:</strong> {contacto.notas}</p>}
                    </div>
                    <div style={{ display: 'flex', gap: '10px', marginLeft: '10px' }}>
                      <button 
                        onClick={() => handleEditar(contacto)}
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
                        onClick={() => handleEliminar(contacto.id)}
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
              ))
            )}
          </div>
        </div>
      ) : (
        <div style={{ background: '#fff', padding: '15px', border: '1px solid #ddd', borderRadius: '8px' }}>
          <h3>{editingId ? 'Editar Contacto' : 'Nuevo Contacto'}</h3>

          <div style={{ marginBottom: '10px' }}>
            <label><strong>Nombre *</strong></label>
            <input
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              placeholder="Nombre del contacto"
              style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ marginBottom: '10px' }}>
            <label><strong>Relación</strong></label>
            <input
              type="text"
              name="relacion"
              value={formData.relacion}
              onChange={handleChange}
              placeholder="Ej: Mamá, Hermana, Vecina"
              style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ marginBottom: '10px' }}>
            <label><strong>Teléfono *</strong></label>
            <input
              type="tel"
              name="telefono"
              value={formData.telefono}
              onChange={handleChange}
              placeholder="+54 9 11 1234567"
              style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ marginBottom: '10px' }}>
            <label><strong>Teléfono Alternativo</strong></label>
            <input
              type="tel"
              name="telefono_alternativo"
              value={formData.telefono_alternativo}
              onChange={handleChange}
              style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ marginBottom: '10px' }}>
            <label><strong>Email</strong></label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ marginBottom: '10px' }}>
            <label><strong>Disponibilidad</strong></label>
            <input
              type="text"
              name="disponibilidad"
              value={formData.disponibilidad}
              onChange={handleChange}
              placeholder="Ej: Lunes-viernes 9-17hs"
              style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ marginBottom: '10px' }}>
            <label><strong>Notas</strong></label>
            <textarea
              name="notas"
              value={formData.notas}
              onChange={handleChange}
              style={{ width: '100%', height: '60px', padding: '8px', boxSizing: 'border-box', fontFamily: 'Arial' }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label>
              <input
                type="checkbox"
                name="es_principal"
                checked={formData.es_principal}
                onChange={handleChange}
              />
              {' '}Contacto principal
            </label>
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
