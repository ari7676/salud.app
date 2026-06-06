import { useState, useEffect } from 'react';
import { useApi } from '../useApi';

export default function Medicinas({ usuarioId }) {
  const { get, post, put, loading, error } = useApi();
  const [medicinas, setMedicinas] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [formData, setFormData] = useState({
    usuario_id: usuarioId,
    nombre_droga: '',
    dosis: '',
    unidad: 'mg',
    frecuencia: '',
    horario_1: '',
    horario_2: '',
    horario_3: '',
    fecha_inicio: new Date().toISOString().split('T')[0],
    fecha_fin: '',
    indicacion: '',
    cantidad_frasco: ''
  });

  useEffect(() => {
    loadMedicinas();
  }, [usuarioId]);

  const loadMedicinas = async () => {
    try {
      const data = await get(`/medicinas?usuario_id=${usuarioId}`);
      setMedicinas(data);
    } catch (err) {
      console.error('Error loading medicinas:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await post('/medicinas', formData);
      setSuccessMsg('✓ Medicina agregada exitosamente');
      setFormData({
        usuario_id: usuarioId,
        nombre_droga: '',
        dosis: '',
        unidad: 'mg',
        frecuencia: '',
        horario_1: '',
        horario_2: '',
        horario_3: '',
        fecha_inicio: new Date().toISOString().split('T')[0],
        fecha_fin: '',
        indicacion: '',
        cantidad_frasco: ''
      });
      setShowForm(false);
      await loadMedicinas();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error('Error creating medicina:', err);
    }
  };

  const handleSuspender = async (medicinaId) => {
    try {
      await put(`/medicinas/${medicinaId}`, {
        fecha_fin: new Date().toISOString().split('T')[0]
      });
      setSuccessMsg('✓ Medicina suspendida');
      await loadMedicinas();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error('Error suspending medicina:', err);
    }
  };

  if (loading && medicinas.length === 0) {
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
          {showForm ? '✕ Cancelar' : '+ Nueva medicina'}
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: '30px' }}>
          <h3 style={{ marginBottom: '20px' }}>Agregar nueva medicina</h3>
          <form onSubmit={handleSubmit} className="form">
            <div className="form-group">
  <label>Nombre de la droga *</label>
  <input
    type="text"
    name="nombre_droga"
    placeholder="Escribí para buscar..."
    value={formData.nombre_droga}
    onChange={handleChange}
    list="vademecum"
    required
  />
  <datalist id="vademecum">
    <option value="Ácido acetilsalicílico (Aspirina)" />
    <option value="Ácido fólico" />
    <option value="Ácido valproico" />
    <option value="Alprazolam" />
    <option value="Amiodarona" />
    <option value="Amoxicilina" />
    <option value="Amoxicilina + Clavulánico" />
    <option value="Atenolol" />
    <option value="Atorvastatina" />
    <option value="Azitromicina" />
    <option value="Bisoprolol" />
    <option value="Carvedilol" />
    <option value="Ciprofloxacina" />
    <option value="Clonazepam" />
    <option value="Clopidogrel" />
    <option value="Diazepam" />
    <option value="Digoxina" />
    <option value="Enalapril" />
    <option value="Escitalopram" />
    <option value="Esomeprazol" />
    <option value="Espironolactona" />
    <option value="Fluoxetina" />
    <option value="Furosemida" />
    <option value="Hidroclorotiazida" />
    <option value="Ibuprofeno" />
    <option value="Insulina Glargina" />
    <option value="Insulina Regular" />
    <option value="Irbesartán" />
    <option value="Lansoprazol" />
    <option value="Levotiroxina" />
    <option value="Lisinopril" />
    <option value="Lorazepam" />
    <option value="Losartán" />
    <option value="Metformina" />
    <option value="Metoprolol" />
    <option value="Metronidazol" />
    <option value="Midazolam" />
    <option value="Naproxeno" />
    <option value="Nifedipina" />
    <option value="Nistatina" />
    <option value="Omeprazol" />
    <option value="Paracetamol" />
    <option value="Pantoprazol" />
    <option value="Prednisona" />
    <option value="Quetiapina" />
    <option value="Ramipril" />
    <option value="Risperidona" />
    <option value="Rosuvastatina" />
    <option value="Sertralina" />
    <option value="Simvastatina" />
    <option value="Tramadol" />
    <option value="Valsartán" />
    <option value="Venlafaxina" />
    <option value="Warfarina" />
  </datalist>
</div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '15px' }}>
              <div className="form-group">
                <label>Dosis *</label>
                <input
                  type="text"
                  name="dosis"
                  placeholder="500, 20, 10.5..."
                  value={formData.dosis}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Unidad</label>
                <select name="unidad" value={formData.unidad} onChange={handleChange}>
                  <option value="mg">mg</option>
                  <option value="ml">ml</option>
                  <option value="comprimidos">comprimidos</option>
                  <option value="gotas">gotas</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Frecuencia *</label>
              <input
                type="text"
                name="frecuencia"
                placeholder="cada 8h, cada 12h, 1x diaria, etc"
                value={formData.frecuencia}
                onChange={handleChange}
                required
              />
            </div>

            <div style={{ padding: '15px', background: '#f3f4f6', borderRadius: '6px', marginBottom: '15px' }}>
              <p style={{ fontWeight: '500', marginBottom: '10px', fontSize: '14px' }}>Horarios</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Horario 1</label>
                  <input
                    type="time"
                    name="horario_1"
                    value={formData.horario_1}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Horario 2</label>
                  <input
                    type="time"
                    name="horario_2"
                    value={formData.horario_2}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Horario 3</label>
                  <input
                    type="time"
                    name="horario_3"
                    value={formData.horario_3}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            <div className="form-group">
              <label>Indicación (para qué sirve)</label>
              <input
                type="text"
                name="indicacion"
                placeholder="Colesterol, Presión arterial, etc"
                value={formData.indicacion}
                onChange={handleChange}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div className="form-group">
                <label>Cantidad en frasco</label>
                <input
                  type="number"
                  name="cantidad_frasco"
                  placeholder="30, 60..."
                  value={formData.cantidad_frasco}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label>Fecha de fin (opcional)</label>
                <input
                  type="date"
                  name="fecha_fin"
                  value={formData.fecha_fin}
                  onChange={handleChange}
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary">Guardar medicina</button>
          </form>
        </div>
      )}

      {medicinas.length > 0 ? (
        <div className="list">
          {medicinas.map((med) => (
            <div key={med.id} className="list-item">
              <div className="list-item-header">
                <div>
                  <div className="list-item-title">{med.nombre_droga}</div>
                  <p style={{ fontSize: '12px', marginTop: '3px', color: 'var(--text-light)' }}>
                    {med.dosis} {med.unidad} • {med.frecuencia}
                  </p>
                  {med.indicacion && (
                    <p style={{ fontSize: '12px', marginTop: '5px' }}>💊 {med.indicacion}</p>
                  )}
                </div>
                {med.fecha_fin && (
                  <span className="badge badge-warning">Termina {new Date(med.fecha_fin).toLocaleDateString('es-AR')}</span>
                )}
              </div>

              {(med.horario_1 || med.horario_2 || med.horario_3) && (
                <div className="list-item-meta" style={{ marginBottom: '10px' }}>
                  {med.horario_1 && <span>🕐 {med.horario_1}</span>}
                  {med.horario_2 && <span>🕐 {med.horario_2}</span>}
                  {med.horario_3 && <span>🕐 {med.horario_3}</span>}
                </div>
              )}

              {med.cantidad_frasco && (
                <p style={{ fontSize: '12px', color: 'var(--text-light)', marginBottom: '10px' }}>
                  📦 {med.cantidad_frasco} unidades disponibles
                </p>
              )}

              {!med.fecha_fin && (
                <button
                  className="btn btn-danger btn-small"
                  onClick={() => handleSuspender(med.id)}
                >
                  🛑 Suspender
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <h3>No hay medicinas registradas</h3>
          <p>Agrega tus medicinas para mantenerlas bajo control</p>
        </div>
      )}
    </div>
  );
}
