import express from 'express';
import sqlite3 from 'sqlite3';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fetch from 'node-fetch';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(cors());
app.use(express.json());

const db = new sqlite3.Database('./health_app.db', (err) => {
  if (err) console.error('DB error:', err);
  else console.log('✓ DB conectada');
});

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

db.serialize(() => {
  db.run('ALTER TABLE usuarios ADD COLUMN localidad TEXT', () => {});
  db.run('ALTER TABLE usuarios ADD COLUMN plan TEXT', () => {});
  db.run('ALTER TABLE usuarios ADD COLUMN salud_publica INTEGER DEFAULT 0', () => {});
});

// ============================================
// USUARIOS
// ============================================

app.post('/api/usuarios', async (req, res) => {
  const { nombre, email, telefono, fecha_nacimiento, tipo_usuario, usuario_padre_id, condicion_especial, obra_social } = req.body;
  try {
    const result = await dbRun(
      'INSERT INTO usuarios (nombre, email, telefono, fecha_nacimiento, tipo_usuario, usuario_padre_id, condicion_especial, obra_social) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [nombre, email, telefono, fecha_nacimiento, tipo_usuario || 'titular', usuario_padre_id || null, condicion_especial, obra_social]
    );
    res.json({ id: result.lastID, mensaje: 'Usuario creado' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/usuarios/:id', async (req, res) => {
  try {
    const usuario = await dbGet('SELECT * FROM usuarios WHERE id = ?', [req.params.id]);
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
    let familia = [];
    if (usuario.tipo_usuario === 'titular') {
      familia = await dbAll('SELECT * FROM usuarios WHERE usuario_padre_id = ?', [req.params.id]);
    }
    res.json({ usuario, familia });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/usuarios/:id', async (req, res) => {
  const { nombre, fecha_nacimiento, telefono, localidad, obra_social, plan, salud_publica } = req.body;
  try {
    await dbRun(
      'UPDATE usuarios SET nombre=?, fecha_nacimiento=?, telefono=?, localidad=?, obra_social=?, plan=?, salud_publica=? WHERE id=?',
      [nombre, fecha_nacimiento || null, telefono || null, localidad || null, obra_social || null, plan || null, salud_publica || 0, req.params.id]
    );
    res.json({ mensaje: 'Perfil actualizado' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

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

app.post('/api/turnos', async (req, res) => {
  const { usuario_id, especialidad, medico, fecha_turno, hora_turno, lugar, obra_social, tipo_atencion, alarma_7_dias, alarma_24_horas, alarma_1_hora } = req.body;
  try {
    const result = await dbRun(
      'INSERT INTO turnos (usuario_id, especialidad, medico, fecha_turno, hora_turno, lugar, obra_social, tipo_atencion, alarma_7_dias, alarma_24_horas, alarma_1_hora) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [usuario_id, especialidad, medico, fecha_turno, hora_turno, lugar, obra_social, tipo_atencion || 'privada', alarma_7_dias ?? 1, alarma_24_horas ?? 1, alarma_1_hora ?? 1]
    );
    res.json({ id: result.lastID, mensaje: 'Turno creado' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

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

app.get('/api/turnos/:id', async (req, res) => {
  try {
    const turno = await dbGet('SELECT * FROM turnos WHERE id = ?', [req.params.id]);
    res.json(turno || { error: 'Turno no encontrado' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/turnos/:id', async (req, res) => {
  const { especialidad, medico, fecha_turno, hora_turno, lugar, obra_social, tipo_atencion, notas, asistido, alarma_7_dias, alarma_24_horas, alarma_1_hora } = req.body;
  try {
    await dbRun(
      'UPDATE turnos SET especialidad=?, medico=?, fecha_turno=?, hora_turno=?, lugar=?, obra_social=?, tipo_atencion=?, notas=?, asistido=?, alarma_7_dias=?, alarma_24_horas=?, alarma_1_hora=?, updated_at=CURRENT_TIMESTAMP WHERE id=?',
      [especialidad, medico, fecha_turno, hora_turno, lugar, obra_social, tipo_atencion, notas, asistido ? 1 : 0, alarma_7_dias ? 1 : 0, alarma_24_horas ? 1 : 0, alarma_1_hora ? 1 : 0, req.params.id]
    );
    res.json({ mensaje: 'Turno actualizado' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/turnos/:id', async (req, res) => {
  try {
    await dbRun('DELETE FROM turnos WHERE id = ?', [req.params.id]);
    res.json({ mensaje: 'Turno eliminado' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ============================================
// MEDICINAS
// ============================================

app.post('/api/medicinas', async (req, res) => {
  const { usuario_id, nombre_droga, dosis, unidad, frecuencia, horario_1, horario_2, horario_3, fecha_inicio, fecha_fin, indicacion, cantidad_frasco, fecha_proximo_refill } = req.body;
  try {
    const result = await dbRun(
      'INSERT INTO medicinas (usuario_id, nombre_droga, dosis, unidad, frecuencia, horario_1, horario_2, horario_3, fecha_inicio, fecha_fin, indicacion, cantidad_frasco, fecha_proximo_refill) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [usuario_id, nombre_droga, dosis, unidad || 'mg', frecuencia, horario_1, horario_2, horario_3, fecha_inicio, fecha_fin, indicacion, cantidad_frasco, fecha_proximo_refill]
    );
    res.json({ id: result.lastID, mensaje: 'Medicina agregada' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

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

app.get('/api/medicinas/:id', async (req, res) => {
  try {
    const medicina = await dbGet('SELECT * FROM medicinas WHERE id = ?', [req.params.id]);
    res.json(medicina || { error: 'Medicina no encontrada' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

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
    await dbRun('UPDATE medicinas SET ' + updates.join(', ') + ' WHERE id = ?', params);
    res.json({ mensaje: 'Medicina actualizada' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ============================================
// HISTORIALES CLINICOS
// ============================================

app.get('/api/historiales/:usuario_id', async (req, res) => {
  try {
    const result = await dbGet('SELECT * FROM historiales_clinicos WHERE usuario_id = ?', [req.params.usuario_id]);
    res.json(result || {});
  } catch (err) { res.status(400).json({ error: err.message }); }
});

app.post('/api/historiales', async (req, res) => {
  try {
    const { usuario_id, resumen_general, alergias, enfermedades_cronicas, operaciones_previas, hospitalizaciones, observaciones } = req.body;
    const existing = await dbGet('SELECT id FROM historiales_clinicos WHERE usuario_id = ?', [usuario_id]);
    if (existing) {
      await dbRun(
        'UPDATE historiales_clinicos SET resumen_general=?, alergias=?, enfermedades_cronicas=?, operaciones_previas=?, hospitalizaciones=?, observaciones=?, updated_at=CURRENT_TIMESTAMP WHERE usuario_id=?',
        [resumen_general, alergias, enfermedades_cronicas, operaciones_previas, hospitalizaciones, observaciones, usuario_id]
      );
      res.json({ message: 'Historial actualizado' });
    } else {
      await dbRun(
        'INSERT INTO historiales_clinicos (usuario_id, resumen_general, alergias, enfermedades_cronicas, operaciones_previas, hospitalizaciones, observaciones) VALUES (?,?,?,?,?,?,?)',
        [usuario_id, resumen_general, alergias, enfermedades_cronicas, operaciones_previas, hospitalizaciones, observaciones]
      );
      res.json({ message: 'Historial creado' });
    }
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// ============================================
// CONTACTOS DE EMERGENCIA
// ============================================

app.get('/api/contactos/:usuario_id', async (req, res) => {
  try {
    const results = await dbAll('SELECT * FROM contactos_emergencia WHERE usuario_id = ? ORDER BY es_principal DESC', [req.params.usuario_id]);
    res.json(results);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

app.post('/api/contactos', async (req, res) => {
  try {
    const { usuario_id, nombre, relacion, telefono, telefono_alternativo, email, direccion, disponibilidad, notas, es_principal } = req.body;
    await dbRun(
      'INSERT INTO contactos_emergencia (usuario_id, nombre, relacion, telefono, telefono_alternativo, email, direccion, disponibilidad, notas, es_principal) VALUES (?,?,?,?,?,?,?,?,?,?)',
      [usuario_id, nombre, relacion, telefono, telefono_alternativo||null, email||null, direccion||null, disponibilidad||null, notas||null, es_principal||0]
    );
    res.json({ message: 'Contacto creado' });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

app.put('/api/contactos/:id', async (req, res) => {
  try {
    const { nombre, relacion, telefono, telefono_alternativo, email, direccion, disponibilidad, notas, es_principal } = req.body;
    await dbRun(
      'UPDATE contactos_emergencia SET nombre=?, relacion=?, telefono=?, telefono_alternativo=?, email=?, direccion=?, disponibilidad=?, notas=?, es_principal=? WHERE id=?',
      [nombre, relacion, telefono, telefono_alternativo||null, email||null, direccion||null, disponibilidad||null, notas||null, es_principal||0, req.params.id]
    );
    res.json({ message: 'Contacto actualizado' });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

app.delete('/api/contactos/:id', async (req, res) => {
  try {
    await dbRun('DELETE FROM contactos_emergencia WHERE id = ?', [req.params.id]);
    res.json({ message: 'Contacto eliminado' });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// ============================================
// CONDICIONES MEDICAS
// ============================================

app.get('/api/condiciones/:usuario_id', async (req, res) => {
  try {
    const results = await dbAll('SELECT * FROM condiciones_medicas WHERE usuario_id = ? ORDER BY tipo, nombre', [req.params.usuario_id]);
    res.json(results);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

app.post('/api/condiciones', async (req, res) => {
  try {
    const { usuario_id, tipo, nombre, descripcion, fecha_diagnostico, fecha_operacion, estado, tratamiento, medico_responsable, hospital_clinica, observaciones } = req.body;
    await dbRun(
      'INSERT INTO condiciones_medicas (usuario_id, tipo, nombre, descripcion, fecha_diagnostico, fecha_operacion, estado, tratamiento, medico_responsable, hospital_clinica, observaciones) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
      [usuario_id, tipo, nombre, descripcion||null, fecha_diagnostico||null, fecha_operacion||null, estado||null, tratamiento||null, medico_responsable||null, hospital_clinica||null, observaciones||null]
    );
    res.json({ message: 'Condicion creada' });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

app.put('/api/condiciones/:id', async (req, res) => {
  try {
    const { tipo, nombre, descripcion, fecha_diagnostico, fecha_operacion, estado, tratamiento, medico_responsable, hospital_clinica, observaciones } = req.body;
    await dbRun(
      'UPDATE condiciones_medicas SET tipo=?, nombre=?, descripcion=?, fecha_diagnostico=?, fecha_operacion=?, estado=?, tratamiento=?, medico_responsable=?, hospital_clinica=?, observaciones=?, updated_at=CURRENT_TIMESTAMP WHERE id=?',
      [tipo, nombre, descripcion||null, fecha_diagnostico||null, fecha_operacion||null, estado||null, tratamiento||null, medico_responsable||null, hospital_clinica||null, observaciones||null, req.params.id]
    );
    res.json({ message: 'Condicion actualizada' });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

app.delete('/api/condiciones/:id', async (req, res) => {
  try {
    await dbRun('DELETE FROM condiciones_medicas WHERE id = ?', [req.params.id]);
    res.json({ message: 'Condicion eliminada' });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// ============================================
// VACUNAS
// ============================================

app.get('/api/vacunas/:usuario_id', async (req, res) => {
  try {
    const results = await dbAll('SELECT * FROM vacunas WHERE usuario_id = ? ORDER BY fecha_aplicacion DESC', [req.params.usuario_id]);
    res.json(results);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

app.post('/api/vacunas', async (req, res) => {
  try {
    const { usuario_id, nombre, fecha_aplicacion, fecha_proxima, dosis, numero_dosis, total_dosis, laboratorio, lote, lugar_aplicacion, medico, estado, notas } = req.body;
    await dbRun(
      'INSERT INTO vacunas (usuario_id, nombre, fecha_aplicacion, fecha_proxima, dosis, numero_dosis, total_dosis, laboratorio, lote, lugar_aplicacion, medico, estado, notas) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)',
      [usuario_id, nombre, fecha_aplicacion||null, fecha_proxima||null, dosis||null, numero_dosis||1, total_dosis||null, laboratorio||null, lote||null, lugar_aplicacion||null, medico||null, estado||'aplicada', notas||null]
    );
    res.json({ message: 'Vacuna creada' });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

app.put('/api/vacunas/:id', async (req, res) => {
  try {
    const { nombre, fecha_aplicacion, fecha_proxima, dosis, numero_dosis, total_dosis, laboratorio, lote, lugar_aplicacion, medico, estado, notas } = req.body;
    await dbRun(
      'UPDATE vacunas SET nombre=?, fecha_aplicacion=?, fecha_proxima=?, dosis=?, numero_dosis=?, total_dosis=?, laboratorio=?, lote=?, lugar_aplicacion=?, medico=?, estado=?, notas=? WHERE id=?',
      [nombre, fecha_aplicacion||null, fecha_proxima||null, dosis||null, numero_dosis||1, total_dosis||null, laboratorio||null, lote||null, lugar_aplicacion||null, medico||null, estado||'aplicada', notas||null, req.params.id]
    );
    res.json({ message: 'Vacuna actualizada' });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

app.delete('/api/vacunas/:id', async (req, res) => {
  try {
    await dbRun('DELETE FROM vacunas WHERE id = ?', [req.params.id]);
    res.json({ message: 'Vacuna eliminada' });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// ============================================
// PREPAGAS
// ============================================

app.get('/api/prepagas/:usuario_id', async (req, res) => {
  try {
    const results = await dbAll('SELECT * FROM prepagas WHERE usuario_id = ?', [req.params.usuario_id]);
    res.json(results);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

app.post('/api/prepagas', async (req, res) => {
  try {
    const { usuario_id, nombre, plan, numero_afiliado, telefono, telefono_emergencias, email, web, app_link, vencimiento_carnet, observaciones } = req.body;
    await dbRun(
      'INSERT INTO prepagas (usuario_id, nombre, plan, numero_afiliado, telefono, telefono_emergencias, email, web, app_link, vencimiento_carnet, observaciones) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
      [usuario_id, nombre, plan||null, numero_afiliado||null, telefono||null, telefono_emergencias||null, email||null, web||null, app_link||null, vencimiento_carnet||null, observaciones||null]
    );
    res.json({ message: 'Prepaga creada' });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

app.put('/api/prepagas/:id', async (req, res) => {
  try {
    const { nombre, plan, numero_afiliado, telefono, telefono_emergencias, email, web, app_link, vencimiento_carnet, observaciones } = req.body;
    await dbRun(
      'UPDATE prepagas SET nombre=?, plan=?, numero_afiliado=?, telefono=?, telefono_emergencias=?, email=?, web=?, app_link=?, vencimiento_carnet=?, observaciones=? WHERE id=?',
      [nombre, plan||null, numero_afiliado||null, telefono||null, telefono_emergencias||null, email||null, web||null, app_link||null, vencimiento_carnet||null, observaciones||null, req.params.id]
    );
    res.json({ message: 'Prepaga actualizada' });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

app.delete('/api/prepagas/:id', async (req, res) => {
  try {
    await dbRun('DELETE FROM prepagas WHERE id = ?', [req.params.id]);
    res.json({ message: 'Prepaga eliminada' });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// ============================================
// MIGRACION
// ============================================

app.get('/api/migrate', async (req, res) => {
  const cols = [
    'ALTER TABLE usuarios ADD COLUMN localidad TEXT',
    'ALTER TABLE usuarios ADD COLUMN plan TEXT',
    'ALTER TABLE usuarios ADD COLUMN salud_publica INTEGER DEFAULT 0',
    'ALTER TABLE usuarios ADD COLUMN fecha_nacimiento DATE',
    'ALTER TABLE usuarios ADD COLUMN telefono TEXT',
    'ALTER TABLE historiales_clinicos ADD COLUMN hospitalizaciones TEXT',
    'ALTER TABLE contactos_emergencia ADD COLUMN telefono_alternativo TEXT',
    'ALTER TABLE contactos_emergencia ADD COLUMN email TEXT',
    'ALTER TABLE contactos_emergencia ADD COLUMN direccion TEXT',
    'ALTER TABLE contactos_emergencia ADD COLUMN disponibilidad TEXT',
    'ALTER TABLE contactos_emergencia ADD COLUMN notas TEXT',
  ];
  const results = [];
  for (const sql of cols) {
    try { await dbRun(sql); results.push({ sql, ok: true }); }
    catch (e) { results.push({ sql, error: e.message }); }
  }
  res.json(results);
});

// ============================================
// ASISTENTE IA (Groq)
// ============================================

app.post('/api/asistente', async (req, res) => {
  const { messages, usuario_id } = req.body;
  try {
    const [turnos, medicinas, condiciones] = await Promise.all([
      dbAll('SELECT * FROM turnos WHERE usuario_id = ?', [usuario_id]),
      dbAll('SELECT * FROM medicinas WHERE usuario_id = ?', [usuario_id]),
      dbAll('SELECT * FROM condiciones_medicas WHERE usuario_id = ?', [usuario_id]),
    ]);

    var turnosText = turnos.length ? turnos.map(function(t) { return '- ' + t.especialidad + ' con ' + t.medico + ' el ' + t.fecha_turno + ' a las ' + t.hora_turno; }).join('\n') : 'Sin turnos';
    var medicinasText = medicinas.length ? medicinas.map(function(m) { return '- ' + m.nombre_droga + ' ' + m.dosis + m.unidad + ' cada ' + m.frecuencia; }).join('\n') : 'Sin medicamentos';
    var condicionesText = condiciones.length ? condiciones.map(function(c) { return '- ' + c.nombre + ': ' + (c.descripcion || 'sin descripcion'); }).join('\n') : 'Sin condiciones';

    var system = 'Sos un asistente de salud personal. Responde en espanol, de forma clara y empatica.\n' +
      'No reemplazas a un medico - siempre recomenda consultar un profesional ante dudas serias.\n\n' +
      'TURNOS MEDICOS:\n' + turnosText + '\n\n' +
      'MEDICAMENTOS:\n' + medicinasText + '\n\n' +
      'CONDICIONES MEDICAS:\n' + condicionesText;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + process.env.GROQ_API_KEY
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'system', content: system }].concat(messages),
        max_tokens: 1024
      })
    });

    const data = await response.json();

    if (response.status !== 200) {
      return res.status(500).json({ error: 'Groq error ' + response.status + ': ' + (data && data.error ? data.error.message : 'desconocido') });
    }

    const text = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
    if (!text) {
      return res.status(500).json({ error: 'Respuesta invalida de Groq' });
    }
    res.json({ text });
  } catch (err) {
    console.error('Error asistente:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// ARCHIVOS
// ============================================

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.html', '.jpg', '.jpeg', '.png', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    allowed.includes(ext) ? cb(null, true) : cb(new Error('Tipo de archivo no permitido'));
  }
});

app.post('/api/archivos', upload.single('archivo'), async (req, res) => {
  try {
    const { usuario_id, descripcion } = req.body;
    const result = await dbRun(
      'INSERT INTO archivos (usuario_id, nombre_original, nombre_archivo, tipo, tamanio, descripcion) VALUES (?, ?, ?, ?, ?, ?)',
      [usuario_id, req.file.originalname, req.file.filename, req.file.mimetype, req.file.size, descripcion || '']
    );
    res.json({ id: result.lastID, mensaje: 'Archivo subido' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/archivos/:usuario_id', async (req, res) => {
  try {
    const archivos = await dbAll('SELECT * FROM archivos WHERE usuario_id = ? ORDER BY created_at DESC', [req.params.usuario_id]);
    res.json(archivos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/archivos/download/:filename', (req, res) => {
  const filePath = path.join(uploadsDir, req.params.filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Archivo no encontrado' });
  res.download(filePath);
});

app.delete('/api/archivos/:id', async (req, res) => {
  try {
    const archivo = await dbGet('SELECT * FROM archivos WHERE id = ?', [req.params.id]);
    if (archivo) {
      const filePath = path.join(uploadsDir, archivo.nombre_archivo);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      await dbRun('DELETE FROM archivos WHERE id = ?', [req.params.id]);
    }
    res.json({ mensaje: 'Archivo eliminado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.use('/uploads', express.static(uploadsDir));

// ============================================
// HEALTH CHECK Y ARRANQUE
// ============================================

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Server error' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log('Server running on http://localhost:' + PORT);
});
