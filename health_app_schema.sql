-- ============================================
-- HEALTH APP MVP - Schema SQL
-- ============================================

-- TABLA: USUARIOS (titulares + familiares)
CREATE TABLE usuarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  email TEXT UNIQUE,
  telefono TEXT,
  fecha_nacimiento DATE,
  tipo_usuario TEXT CHECK(tipo_usuario IN ('titular', 'familiar')), -- titular o familiar
  usuario_padre_id INTEGER, -- ref al titular si es familiar
  condicion_especial TEXT, -- celíaco, diabético, alérgico, etc
  obra_social TEXT, -- prepaga, obra social, público
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(usuario_padre_id) REFERENCES usuarios(id)
);

-- TABLA: TURNOS (citas médicas)
CREATE TABLE turnos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario_id INTEGER NOT NULL,
  especialidad TEXT NOT NULL, -- cardiología, pediatría, etc
  medico TEXT,
  fecha_turno DATE NOT NULL,
  hora_turno TIME NOT NULL,
  lugar TEXT, -- hospital, consultorio, domicilio
  obra_social TEXT, -- dónde se atiende (OSDE, Swiss Medical, etc)
  tipo_atencion TEXT CHECK(tipo_atencion IN ('pública', 'prepaga', 'privada')),
  
  -- Alarmas previas
  alarma_7_dias BOOLEAN DEFAULT 1, -- notificar 7 días antes
  alarma_24_horas BOOLEAN DEFAULT 1, -- notificar 24h antes
  alarma_1_hora BOOLEAN DEFAULT 1, -- notificar 1h antes
  
  -- Tracking
  asistido BOOLEAN DEFAULT 0,
  notas TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY(usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- TABLA: MEDICINAS (fármacos)
CREATE TABLE medicinas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario_id INTEGER NOT NULL,
  nombre_droga TEXT NOT NULL, -- ibupirofeno, metformina, etc
  dosis TEXT NOT NULL, -- ej: 500mg
  unidad TEXT DEFAULT 'mg', -- mg, ml, comprimidos
  frecuencia TEXT NOT NULL, -- cada 8h, 1x diaria, cada 12h
  
  -- Horarios específicos
  horario_1 TIME,
  horario_2 TIME,
  horario_3 TIME,
  horario_4 TIME,
  
  fecha_inicio DATE,
  fecha_fin DATE, -- NULL si es indefinido
  indicacion TEXT, -- para qué sirve
  efectos_secundarios TEXT,
  
  -- Control
  cantidad_frasco INTEGER, -- cuántas unidades tiene
  fecha_proximo_refill DATE,
  recordatorio_refill BOOLEAN DEFAULT 1,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY(usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- TABLA: HISTORIAL_MEDICINAS (log de cambios)
CREATE TABLE historial_medicinas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  medicina_id INTEGER NOT NULL,
  accion TEXT, -- 'creada', 'actualizada', 'suspendida'
  fecha_cambio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  notas TEXT,
  FOREIGN KEY(medicina_id) REFERENCES medicinas(id) ON DELETE CASCADE
);

-- TABLA: RECORDATORIOS (para medicinas)
CREATE TABLE recordatorios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  medicina_id INTEGER NOT NULL,
  usuario_id INTEGER NOT NULL,
  horario_recordatorio TIME NOT NULL,
  completado BOOLEAN DEFAULT 0,
  fecha_recordatorio DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(medicina_id) REFERENCES medicinas(id) ON DELETE CASCADE,
  FOREIGN KEY(usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- TABLA: HISTORIALES_CLINICOS (resumen clínico del usuario)
CREATE TABLE historiales_clinicos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario_id INTEGER NOT NULL UNIQUE,
  resumen_general TEXT, -- resumen general de salud
  alergias TEXT, -- alergias (separadas por coma)
  enfermedades_cronicas TEXT, -- diabetes, hipertensión, etc
  operaciones_previas TEXT, -- historial quirúrgico
  hospitalizaciones TEXT, -- historial de internaciones
  observaciones TEXT, -- observaciones generales
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);\n\n-- TABLA: CONTACTOS_EMERGENCIA (familiares/conocidos de emergencia)
CREATE TABLE contactos_emergencia (\n  id INTEGER PRIMARY KEY AUTOINCREMENT,\n  usuario_id INTEGER NOT NULL,\n  nombre TEXT NOT NULL,\n  relacion TEXT, -- mamá, papá, hermano, amigo, vecino\n  telefono TEXT NOT NULL,\n  telefono_alternativo TEXT,\n  email TEXT,\n  direccion TEXT,\n  disponibilidad TEXT, -- horarios disponibles\n  notas TEXT,\n  es_principal BOOLEAN DEFAULT 0, -- contacto principal\n  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n  FOREIGN KEY(usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE\n);\n\n-- TABLA: CONDICIONES_MEDICAS (enfermedades, alergias, operaciones específicas)\nCREATE TABLE condiciones_medicas (\n  id INTEGER PRIMARY KEY AUTOINCREMENT,\n  usuario_id INTEGER NOT NULL,\n  tipo TEXT CHECK(tipo IN ('enfermedad', 'alergia', 'operacion')), -- tipo de condición\n  nombre TEXT NOT NULL, -- diabetes, apendicitis, penicilina\n  descripcion TEXT,\n  fecha_diagnostico DATE,\n  fecha_operacion DATE, -- para operaciones\n  estado TEXT, -- activa, controlada, curada, resuelta\n  tratamiento TEXT, -- tratamiento actual\n  medico_responsable TEXT,\n  hospital_clinica TEXT,\n  observaciones TEXT,\n  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n  FOREIGN KEY(usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE\n);\n\n-- INDICES para búsquedas rápidas\nCREATE INDEX idx_usuarios_email ON usuarios(email);\nCREATE INDEX idx_usuarios_padre ON usuarios(usuario_padre_id);\nCREATE INDEX idx_turnos_usuario ON turnos(usuario_id);\nCREATE INDEX idx_turnos_fecha ON turnos(fecha_turno);\nCREATE INDEX idx_medicinas_usuario ON medicinas(usuario_id);\nCREATE INDEX idx_medicinas_fecha_fin ON medicinas(fecha_fin);\nCREATE INDEX idx_historiales_usuario ON historiales_clinicos(usuario_id);\nCREATE INDEX idx_contactos_usuario ON contactos_emergencia(usuario_id);\nCREATE INDEX idx_condiciones_usuario ON condiciones_medicas(usuario_id);

-- ============================================
-- DATOS DE EJEMPLO
-- ============================================

-- Usuario titular
INSERT INTO usuarios (nombre, email, telefono, fecha_nacimiento, tipo_usuario, condicion_especial, obra_social)
VALUES ('Juan Pérez', 'juan@example.com', '+54911234567', '1980-05-15', 'titular', NULL, 'OSDE 210');

-- Usuario familiar (hijo)
INSERT INTO usuarios (nombre, fecha_nacimiento, tipo_usuario, usuario_padre_id, condicion_especial)
VALUES ('Mateo Pérez', '2015-03-20', 'familiar', 1, NULL);

-- Turno con alarmas
INSERT INTO turnos (usuario_id, especialidad, medico, fecha_turno, hora_turno, lugar, obra_social, tipo_atencion, alarma_7_dias, alarma_24_horas, alarma_1_hora)
VALUES (1, 'Cardiología', 'Dr. García', '2026-06-10', '10:30', 'Clínica Central', 'OSDE', 'prepaga', 1, 1, 1);

-- Turno pediatría para el hijo
INSERT INTO turnos (usuario_id, especialidad, medico, fecha_turno, hora_turno, lugar, obra_social, tipo_atencion)
VALUES (2, 'Pediatría', 'Dra. López', '2026-06-15', '14:00', 'Hospital Público', 'Hospital', 'pública', 1, 1, 0);

-- Medicinas
INSERT INTO medicinas (usuario_id, nombre_droga, dosis, unidad, frecuencia, horario_1, horario_2, horario_3, fecha_inicio, indicacion, cantidad_frasco, fecha_proximo_refill, recordatorio_refill)
VALUES (1, 'Atorvastatina', '20', 'mg', 'cada 24h', '20:00', NULL, NULL, '2026-01-01', 'Colesterol', 30, '2026-06-20', 1);

INSERT INTO medicinas (usuario_id, nombre_droga, dosis, unidad, frecuencia, horario_1, horario_2, horario_3, fecha_inicio, indicacion, cantidad_frasco, recordatorio_refill)
VALUES (1, 'Losartán', '50', 'mg', 'cada 24h', '08:00', NULL, NULL, '2025-11-01', 'Presión arterial', 30, 1);

INSERT INTO medicinas (usuario_id, nombre_droga, dosis, unidad, frecuencia, horario_1, horario_2, horario_3, fecha_inicio, indicacion, fecha_fin, cantidad_frasco)
VALUES (2, 'Amoxicilina', '250', 'mg', 'cada 8h', '08:00', '14:00', '20:00', '2026-05-20', 'Infección respiratoria', '2026-05-27', 1);

-- Historial clínico Juan Pérez
INSERT INTO historiales_clinicos (usuario_id, resumen_general, alergias, enfermedades_cronicas, operaciones_previas, observaciones)
VALUES (1, 'Paciente con hipertensión controlada y colesterol elevado. Buen estado general.', 'Penicilina, ASA', 'Hipertensión arterial, Hipercolesterolemia', 'Apendicectomía (2005)', 'Sigue tratamiento farmacológico regular');

-- Historial clínico Mateo Pérez
INSERT INTO historiales_clinicos (usuario_id, resumen_general, alergias, enfermedades_cronicas, operaciones_previas, observaciones)
VALUES (2, 'Niño sano, desarrollo normal. Alergias estacionales controladas.', 'Polen, ácaros', NULL, NULL, 'Realizar seguimiento pediátrico regular');

-- Contactos de emergencia Juan Pérez
INSERT INTO contactos_emergencia (usuario_id, nombre, relacion, telefono, telefono_alternativo, es_principal)
VALUES (1, 'Mariana Pérez', 'Esposa', '+549112345678', '+54111234567', 1);

INSERT INTO contactos_emergencia (usuario_id, nombre, relacion, telefono, email, es_principal)
VALUES (1, 'Dr. García', 'Cardiólogo', '+54119876543', 'drgarcia@clinic.com', 0);

-- Contactos de emergencia Mateo Pérez
INSERT INTO contactos_emergencia (usuario_id, nombre, relacion, telefono, es_principal)
VALUES (2, 'Juan Pérez', 'Padre', '+549112345670', 1);

-- Condiciones médicas Juan Pérez
INSERT INTO condiciones_medicas (usuario_id, tipo, nombre, descripcion, fecha_diagnostico, estado, tratamiento, medico_responsable, observaciones)
VALUES (1, 'enfermedad', 'Hipertensión arterial', 'HTA esencial estadío 2', '2010-03-15', 'controlada', 'Losartán 50mg diarios', 'Dr. García', 'Controles cada 3 meses');

INSERT INTO condiciones_medicas (usuario_id, tipo, nombre, descripcion, fecha_diagnostico, estado, tratamiento, medico_responsable)
VALUES (1, 'enfermedad', 'Hipercolesterolemia', 'Colesterol LDL elevado', '2015-08-20', 'controlada', 'Atorvastatina 20mg diarios', 'Dr. García');

INSERT INTO condiciones_medicas (usuario_id, tipo, nombre, fecha_operacion, estado, hospital_clinica, observaciones)
VALUES (1, 'operacion', 'Apendicectomía', '2005-06-10', 'resuelta', 'Hospital Central', 'Sin complicaciones');

INSERT INTO condiciones_medicas (usuario_id, tipo, nombre, estado, observaciones)
VALUES (1, 'alergia', 'Penicilina', 'activa', 'Anafilaxia leve, usar amoxicilina con cuidado');

-- Condiciones médicas Mateo Pérez
INSERT INTO condiciones_medicas (usuario_id, tipo, nombre, estado, observaciones)
VALUES (2, 'alergia', 'Polen', 'activa', 'Alergias estacionales primavera-verano');

INSERT INTO condiciones_medicas (usuario_id, tipo, nombre, estado, observaciones)
VALUES (2, 'alergia', 'Ácaros', 'activa', 'Rinitis alérgica, usar antihistamínicos en invierno');
