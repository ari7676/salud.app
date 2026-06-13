import express from 'express';
import sqlite3 from 'sqlite3';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fetch from 'node-fetch';

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

// ============================================
// RUTAS: HISTORIALES CLÍNICOS
// ============================================

// GET historial clínico de un usuario
app.get('/api/historiales/:usuario_id', (req, res) => {
  try {
    const sql = 'SELECT * FROM historiales_clinicos WHERE usuario_id = ?';
    const stmt = db.prepare(sql);
    const result = stmt.get(req.params.usuario_id);
    res.json(result || {});
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST crear/actualizar historial clínico
app.post('/api/historiales', (req, res) => {
  try {
    const { usuario_id, resumen_general, alergias, enfermedades_cronicas, operaciones_previas, hospitalizaciones, observaciones } = req.body;
    
    // Verificar si existe
    const existing = db.prepare('SELECT id FROM historiales_clinicos WHERE usuario_id = ?').get(usuario_id);
    
    if (existing) {
      const sql = `UPDATE historiales_clinicos 
                   SET resumen_general = ?, alergias = ?, enfermedades_cronicas = ?, 
                       operaciones_previas = ?, hospitalizaciones = ?, observaciones = ?, updated_at = CURRENT_TIMESTAMP
                   WHERE usuario_id = ?`;
      db.prepare(sql).run(resumen_general, alergias, enfermedades_cronicas, operaciones_previas, hospitalizaciones, observaciones, usuario_id);
      res.json({ id: existing.id, message: 'Historial actualizado' });
    } else {
      const sql = `INSERT INTO historiales_clinicos (usuario_id, resumen_general, alergias, enfermedades_cronicas, operaciones_previas, hospitalizaciones, observaciones)
                   VALUES (?, ?, ?, ?, ?, ?, ?)`;
      const result = db.prepare(sql).run(usuario_id, resumen_general, alergias, enfermedades_cronicas, operaciones_previas, hospitalizaciones, observaciones);
      res.json({ id: result.lastID, message: 'Historial creado' });
    }
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ============================================
// RUTAS: CONTACTOS DE EMERGENCIA
// ============================================

// GET contactos de emergencia de un usuario
app.get('/api/contactos/:usuario_id', (req, res) => {
  try {
    const sql = 'SELECT * FROM contactos_emergencia WHERE usuario_id = ? ORDER BY es_principal DESC';
    const stmt = db.prepare(sql);
    const results = stmt.all(req.params.usuario_id);
    res.json(results);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST crear contacto de emergencia
app.post('/api/contactos', (req, res) => {
  try {
    const { usuario_id, nombre, relacion, telefono, telefono_alternativo, email, direccion, disponibilidad, notas, es_principal } = req.body;
    const sql = `INSERT INTO contactos_emergencia (usuario_id, nombre, relacion, telefono, telefono_alternativo, email, direccion, disponibilidad, notas, es_principal)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const result = db.prepare(sql).run(usuario_id, nombre, relacion, telefono, telefono_alternativo || null, email || null, direccion || null, disponibilidad || null, notas || null, es_principal || 0);
    res.json({ id: result.lastID, message: 'Contacto creado' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT actualizar contacto de emergencia
app.put('/api/contactos/:id', (req, res) => {
  try {
    const { nombre, relacion, telefono, telefono_alternativo, email, direccion, disponibilidad, notas, es_principal } = req.body;
    const sql = `UPDATE contactos_emergencia 
                 SET nombre = ?, relacion = ?, telefono = ?, telefono_alternativo = ?, email = ?, direccion = ?, disponibilidad = ?, notas = ?, es_principal = ?
                 WHERE id = ?`;
    db.prepare(sql).run(nombre, relacion, telefono, telefono_alternativo || null, email || null, direccion || null, disponibilidad || null, notas || null, es_principal || 0, req.params.id);
    res.json({ message: 'Contacto actualizado' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE contacto de emergencia
app.delete('/api/contactos/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM contactos_emergencia WHERE id = ?').run(req.params.id);
    res.json({ message: 'Contacto eliminado' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ============================================
// RUTAS: CONDICIONES MÉDICAS
// ============================================

// GET condiciones médicas de un usuario
app.get('/api/condiciones/:usuario_id', (req, res) => {
  try {
    const sql = 'SELECT * FROM condiciones_medicas WHERE usuario_id = ? ORDER BY tipo, nombre';
    const stmt = db.prepare(sql);
    const results = stmt.all(req.params.usuario_id);
    res.json(results);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST crear condición médica
app.post('/api/condiciones', (req, res) => {
  try {
    const { usuario_id, tipo, nombre, descripcion, fecha_diagnostico, fecha_operacion, estado, tratamiento, medico_responsable, hospital_clinica, observaciones } = req.body;
    const sql = `INSERT INTO condiciones_medicas (usuario_id, tipo, nombre, descripcion, fecha_diagnostico, fecha_operacion, estado, tratamiento, medico_responsable, hospital_clinica, observaciones)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const result = db.prepare(sql).run(usuario_id, tipo, nombre, descripcion || null, fecha_diagnostico || null, fecha_operacion || null, estado || null, tratamiento || null, medico_responsable || null, hospital_clinica || null, observaciones || null);
    res.json({ id: result.lastID, message: 'Condición creada' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT actualizar condición médica
app.put('/api/condiciones/:id', (req, res) => {
  try {
    const { tipo, nombre, descripcion, fecha_diagnostico, fecha_operacion, estado, tratamiento, medico_responsable, hospital_clinica, observaciones } = req.body;
    const sql = `UPDATE condiciones_medicas 
                 SET tipo = ?, nombre = ?, descripcion = ?, fecha_diagnostico = ?, fecha_operacion = ?, estado = ?, tratamiento = ?, medico_responsable = ?, hospital_clinica = ?, observaciones = ?, updated_at = CURRENT_TIMESTAMP
                 WHERE id = ?`;
    db.prepare(sql).run(tipo, nombre, descripcion || null, fecha_diagnostico || null, fecha_operacion || null, estado || null, tratamiento || null, medico_responsable || null, hospital_clinica || null, observaciones || null, req.params.id);
    res.json({ message: 'Condición actualizada' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE condición médica
app.delete('/api/condiciones/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM condiciones_medicas WHERE id = ?').run(req.params.id);
    res.json({ message: 'Condición eliminada' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ============================================
// RUTAS: VACUNAS
// ============================================

app.get('/api/vacunas/:usuario_id', (req, res) => {
  try {
    const results = db.prepare('SELECT * FROM vacunas WHERE usuario_id = ? ORDER BY fecha_aplicacion DESC').all(req.params.usuario_id);
    res.json(results);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

app.post('/api/vacunas', (req, res) => {
  try {
    const { usuario_id, nombre, fecha_aplicacion, fecha_proxima, dosis, numero_dosis, total_dosis, laboratorio, lote, lugar_aplicacion, medico, estado, notas } = req.body;
    const result = db.prepare(`INSERT INTO vacunas (usuario_id, nombre, fecha_aplicacion, fecha_proxima, dosis, numero_dosis, total_dosis, laboratorio, lote, lugar_aplicacion, medico, estado, notas) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(usuario_id, nombre, fecha_aplicacion || null, fecha_proxima || null, dosis || null, numero_dosis || 1, total_dosis || null, laboratorio || null, lote || null, lugar_aplicacion || null, medico || null, estado || 'aplicada', notas || null);
    res.json({ id: result.lastInsertRowid, message: 'Vacuna creada' });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

app.put('/api/vacunas/:id', (req, res) => {
  try {
    const { nombre, fecha_aplicacion, fecha_proxima, dosis, numero_dosis, total_dosis, laboratorio, lote, lugar_aplicacion, medico, estado, notas } = req.body;
    db.prepare(`UPDATE vacunas SET nombre=?, fecha_aplicacion=?, fecha_proxima=?, dosis=?, numero_dosis=?, total_dosis=?, laboratorio=?, lote=?, lugar_aplicacion=?, medico=?, estado=?, notas=? WHERE id=?`).run(nombre, fecha_aplicacion || null, fecha_proxima || null, dosis || null, numero_dosis || 1, total_dosis || null, laboratorio || null, lote || null, lugar_aplicacion || null, medico || null, estado || 'aplicada', notas || null, req.params.id);
    res.json({ message: 'Vacuna actualizada' });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

app.delete('/api/vacunas/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM vacunas WHERE id = ?').run(req.params.id);
    res.json({ message: 'Vacuna eliminada' });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// ============================================
// RUTAS: PREPAGAS
// ============================================

app.get('/api/prepagas/:usuario_id', (req, res) => {
  try {
    const results = db.prepare('SELECT * FROM prepagas WHERE usuario_id = ?').all(req.params.usuario_id);
    res.json(results);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

app.post('/api/prepagas', (req, res) => {
  try {
    const { usuario_id, nombre, plan, numero_afiliado, telefono, telefono_emergencias, email, web, app_link, vencimiento_carnet, observaciones } = req.body;
    const result = db.prepare(`INSERT INTO prepagas (usuario_id, nombre, plan, numero_afiliado, telefono, telefono_emergencias, email, web, app_link, vencimiento_carnet, observaciones) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(usuario_id, nombre, plan || null, numero_afiliado || null, telefono || null, telefono_emergencias || null, email || null, web || null, app_link || null, vencimiento_carnet || null, observaciones || null);
    res.json({ id: result.lastInsertRowid, message: 'Prepaga creada' });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

app.put('/api/prepagas/:id', (req, res) => {
  try {
    const { nombre, plan, numero_afiliado, telefono, telefono_emergencias, email, web, app_link, vencimiento_carnet, observaciones } = req.body;
    db.prepare(`UPDATE prepagas SET nombre=?, plan=?, numero_afiliado=?, telefono=?, telefono_emergencias=?, email=?, web=?, app_link=?, vencimiento_carnet=?, observaciones=? WHERE id=?`).run(nombre, plan || null, numero_afiliado || null, telefono || null, telefono_emergencias || null, email || null, web || null, app_link || null, vencimiento_carnet || null, observaciones || null, req.params.id);
    res.json({ message: 'Prepaga actualizada' });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

app.delete('/api/prepagas/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM prepagas WHERE id = ?').run(req.params.id);
    res.json({ message: 'Prepaga eliminada' });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// ASISTENTE IA
app.post('/api/asistente', async (req, res) => {
  const { messages, usuario_id } = req.body;
  
  try {
    const [turnos, medicinas, condiciones] = await Promise.all([
      dbAll('SELECT * FROM turnos WHERE usuario_id = ?', [usuario_id]),
      dbAll('SELECT * FROM medicinas WHERE usuario_id = ?', [usuario_id]),
      dbAll('SELECT * FROM condiciones_medicas WHERE usuario_id = ?', [usuario_id]),
    ]);

    const system = `Sos un asistente de salud personal. Respondé en español, de forma clara y empática.
No reemplazás a un médico — siempre recomendá consultar un profesional ante dudas serias.

TURNOS MÉDICOS:
${turnos.length ? turnos.map(t => `- ${t.especialidad} con ${t.medico} el ${t.fecha_turno} a las ${t.hora_turno}`).join('\n') : 'Sin turnos'}

MEDICAMENTOS:
${medicinas.length ? medicinas.map(m => `- ${m.nombre_droga} ${m.dosis}${m.unidad} cada ${m.frecuencia}`).join('\n') : 'Sin medicamentos'}

CONDICIONES MÉDICAS:
${condiciones.length ? condiciones.map(c => `- ${c.nombre}: ${c.descripcion || 'sin descripción'}`).join('\n') : 'Sin condiciones'}`;

    // Convertir mensajes al formato 
    const geminiContents = messages
  .filter(m => m.content && m.content.trim())
  .map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }]
  }));

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            { role: 'user', parts: [{ text: system }] },
            { role: 'model', parts: [{ text: 'Entendido, voy a ayudarte con tu salud.' }] },
            ...geminiContents
          ],
          generationConfig: { maxOutputTokens: 1024 }
        }),
      }
    );

    const rawText = await response.text();
    console.log('Gemini status:', response.status);
    console.log('Gemini raw:', rawText);
    const data = rawText ? JSON.parse(rawText) : {};

    if (response.status !== 200) {
      return res.status(500).json({
        error: `Gemini error ${response.status}: ${data?.error?.message || 'desconocido'}`,
        gemini_raw: data
      });
    }

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      return res.status(500).json({ error: 'Respuesta inválida de Gemini', data });
    }
    res.json({ text });
  } catch (err) {
    console.error('Error asistente:', err);
    res.status(500).json({ error: err.message });
  }
});

import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Crear carpeta uploads si no existe
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
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.html', '.jpg', '.jpeg', '.png', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    allowed.includes(ext) ? cb(null, true) : cb(new Error('Tipo de archivo no permitido'));
  }
});

// Subir archivo
app.post('/api/archivos', upload.single('archivo'), async (req, res) => {
  try {
    const { usuario_id, descripcion } = req.body;
    const result = await dbRun(
      `INSERT INTO archivos (usuario_id, nombre_original, nombre_archivo, tipo, tamanio, descripcion) VALUES (?, ?, ?, ?, ?, ?)`,
      [usuario_id, req.file.originalname, req.file.filename, req.file.mimetype, req.file.size, descripcion || '']
    );
    res.json({ id: result.lastID, mensaje: 'Archivo subido' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Listar archivos de un usuario
app.get('/api/archivos/:usuario_id', async (req, res) => {
  try {
    const archivos = await dbAll('SELECT * FROM archivos WHERE usuario_id = ? ORDER BY created_at DESC', [req.params.usuario_id]);
    res.json(archivos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Descargar archivo
app.get('/api/archivos/download/:filename', (req, res) => {
  const filePath = path.join(uploadsDir, req.params.filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Archivo no encontrado' });
  res.download(filePath);
});

// Eliminar archivo
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

// Servir archivos estáticos
app.use('/uploads', express.static(uploadsDir));

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
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✓ Server running on http://localhost:${PORT}`);
});
