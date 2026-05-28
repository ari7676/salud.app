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

-- INDICES para búsquedas rápidas
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_padre ON usuarios(usuario_padre_id);
CREATE INDEX idx_turnos_usuario ON turnos(usuario_id);
CREATE INDEX idx_turnos_fecha ON turnos(fecha_turno);
CREATE INDEX idx_medicinas_usuario ON medicinas(usuario_id);
CREATE INDEX idx_medicinas_fecha_fin ON medicinas(fecha_fin);

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
