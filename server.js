import express from 'express';
import sqlite3 from 'sqlite3';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// DB connection
const db = new sqlite3.Database('./health_app.db', (err) => {
  if (err) console.error('DB error:', err);
  else console.log('✓ DB conectada');
});

// Helper para promisify
const dbRun = (sql, params = []) => 
  new Promise((res, rej) => db.run(sql, params, function(err) {
    err ? rej(err) : res(this);
  }));

const dbGet = (sql, params = []) => 
  new Promise((res, rej) => db.get(sql, params, (err, row) => {
    err ? rej(err) : res(row);
  }));

const dbAll = (sql, params = []) => 
  new Promise((res, rej) => db.all(sql, params, (err, rows) => {
    err ? rej(err) : res(rows);
  }));

// ============================================
// USUARIOS
// ============================================

// Crear usuario (titular o familiar)
app.post('/api/usuarios', async (req, res) => {
  const { nombre, email, telefono, fecha_nacimiento, tipo_usuario, usuario_padre_id, condicion_especial, obra_social } = req.body;
  
  try {
    const result = await dbRun(
      `INSERT INTO usuarios (nombre, email, telefono, fecha_nacimiento, tipo_usuario, usuario_padre_id, condicion_especial, obra_social)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [nombre, email, telefono, fecha_nacimiento, tipo_usuario || 'titular', usuario_padre_id || null, condicion_especial, obra_social]
    );
    
    res.json({ id: result.lastID, mensaje: 'Usuario creado' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Obtener usuario con familia
app.get('/api/usuarios/:id', async (req, res) => {
  try {
    const usuario = await dbGet('SELECT * FROM usuarios WHERE id = ?', [req.params.id]);
    
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    // Si es titular, traer familia
    let familia = [];
    if (usuario.tipo_usuario === 'titular') {
      familia = await dbAll('SELECT * FROM usuarios WHERE usuario_padre_id = ?', [req.params.id]);
    }
    
    res.json({ usuario, familia });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Listar todos los usuarios
app.get('/api/usuarios', async (req, res) => {
  try {
    const usuarios = await dbAll('SELECT * FROM usuarios ORDER BY tipo_usuario DESC, nombre');
    res.json(usuarios);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ============================================
// TURNOS
// ============================================

// Crear turno (con alarmas)
app.post('/api/turnos', async (req, res) => {
  const { usuario_id, especialidad, medico, fecha_turno, hora_turno, lugar, obra_social, tipo_atencion, alarma_7_dias, alarma_24_horas, alarma_1_hora } = req.body;
  
  try {
    const result = await dbRun(
      `INSERT INTO turnos (usuario_id, especialidad, medico, fecha_turno, hora_turno, lugar, obra_social, tipo_atencion, alarma_7_dias, alarma_24_horas, alarma_1_hora)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [usuario_id, especialidad, medico, fecha_turno, hora_turno, lugar, obra_social, tipo_atencion || 'privada', alarma_7_dias ?? 1, alarma_24_horas ?? 1, alarma_1_hora ?? 1]
    );
    
    res.json({ id: result.lastID, mensaje: 'Turno creado' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Listar turnos de un usuario
app.get('/api/turnos', async (req, res) => {
  const { usuario_id } = req.query;
  
  try {
    const sql = usuario_id 
      ? 'SELECT * FROM turnos WHERE usuario_id = ? ORDER BY fecha_turno DESC'
      : 'SELECT * FROM turnos ORDER BY fecha_turno DESC';
    
    const turnos = await dbAll(sql, usuario_id ? [usuario_id] : []);
    res.json(turnos);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Obtener turno por ID
app.get('/api/turnos/:id', async (req, res) => {
  try {
    const turno = await dbGet('SELECT * FROM turnos WHERE id = ?', [req.params.id]);
    res.json(turno || { error: 'Turno no encontrado' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Actualizar turno (marcar asistido, cambiar fecha)
app.put('/api/turnos/:id', async (req, res) => {
  const { asistido, fecha_turno, hora_turno, notas } = req.body;
  
  try {
    let updates = [];
    let params = [];
    
    if (asistido !== undefined) { updates.push('asistido = ?'); params.push(asistido); }
    if (fecha_turno) { updates.push('fecha_turno = ?'); params.push(fecha_turno); }
    if (hora_turno) { updates.push('hora_turno = ?'); params.push(hora_turno); }
    if (notas) { updates.push('notas = ?'); params.push(notas); }
    
    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(req.params.id);
    
    if (updates.length === 1) return res.json({ error: 'Sin cambios' });
    
    await dbRun(`UPDATE turnos SET ${updates.join(', ')} WHERE id = ?`, params);
    res.json({ mensaje: 'Turno actualizado' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ============================================
// MEDICINAS
// ============================================

// Crear medicina
app.post('/api/medicinas', async (req, res) => {
  const { usuario_id, nombre_droga, dosis, unidad, frecuencia, horario_1, horario_2, horario_3, fecha_inicio, fecha_fin, indicacion, cantidad_frasco, fecha_proximo_refill } = req.body;
  
  try {
    const result = await dbRun(
      `INSERT INTO medicinas (usuario_id, nombre_droga, dosis, unidad, frecuencia, horario_1, horario_2, horario_3, fecha_inicio, fecha_fin, indicacion, cantidad_frasco, fecha_proximo_refill)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [usuario_id, nombre_droga, dosis, unidad || 'mg', frecuencia, horario_1, horario_2, horario_3, fecha_inicio, fecha_fin, indicacion, cantidad_frasco, fecha_proximo_refill]
    );
    
    res.json({ id: result.lastID, mensaje: 'Medicina agregada' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Listar medicinas de un usuario
app.get('/api/medicinas', async (req, res) => {
  const { usuario_id } = req.query;
  
  try {
    const sql = usuario_id
      ? 'SELECT * FROM medicinas WHERE usuario_id = ? AND (fecha_fin IS NULL OR fecha_fin >= date("now")) ORDER BY nombre_droga'
      : 'SELECT * FROM medicinas ORDER BY nombre_droga';
    
    const medicinas = await dbAll(sql, usuario_id ? [usuario_id] : []);
    res.json(medicinas);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Obtener medicina por ID
app.get('/api/medicinas/:id', async (req, res) => {
  try {
    const medicina = await dbGet('SELECT * FROM medicinas WHERE id = ?', [req.params.id]);
    res.json(medicina || { error: 'Medicina no encontrada' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Actualizar medicina
app.put('/api/medicinas/:id', async (req, res) => {
  const { dosis, frecuencia, horario_1, horario_2, horario_3, fecha_fin, cantidad_frasco, fecha_proximo_refill } = req.body;
  
  try {
    let updates = [];
    let params = [];
    
    if (dosis) { updates.push('dosis = ?'); params.push(dosis); }
    if (frecuencia) { updates.push('frecuencia = ?'); params.push(frecuencia); }
    if (horario_1) { updates.push('horario_1 = ?'); params.push(horario_1); }
    if (horario_2) { updates.push('horario_2 = ?'); params.push(horario_2); }
    if (horario_3) { updates.push('horario_3 = ?'); params.push(horario_3); }
    if (fecha_fin) { updates.push('fecha_fin = ?'); params.push(fecha_fin); }
    if (cantidad_frasco) { updates.push('cantidad_frasco = ?'); params.push(cantidad_frasco); }
    if (fecha_proximo_refill) { updates.push('fecha_proximo_refill = ?'); params.push(fecha_proximo_refill); }
    
    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(req.params.id);
    
    if (updates.length === 1) return res.json({ error: 'Sin cambios' });
    
    await dbRun(`UPDATE medicinas SET ${updates.join(', ')} WHERE id = ?`, params);
    res.json({ mensaje: 'Medicina actualizada' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Server error' });
});

// Start
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✓ Server running on http://localhost:${PORT}`);
});
