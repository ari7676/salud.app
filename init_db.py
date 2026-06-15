import sqlite3
import os

db_path = 'health_app.db'
if os.path.exists(db_path):
    os.remove(db_path)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

cursor.executescript('''
CREATE TABLE usuarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  email TEXT UNIQUE,
  tipo_usuario TEXT,
  usuario_padre_id INTEGER,
  obra_social TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE turnos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario_id INTEGER NOT NULL,
  especialidad TEXT NOT NULL,
  medico TEXT,
  fecha_turno DATE NOT NULL,
  hora_turno TIME NOT NULL,
  lugar TEXT,
  obra_social TEXT,
  asistido BOOLEAN DEFAULT 0,
  notas TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);
CREATE TABLE medicinas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario_id INTEGER NOT NULL,
  nombre_droga TEXT NOT NULL,
  dosis TEXT NOT NULL,
  frecuencia TEXT NOT NULL,
  horario_1 TIME,
  horario_2 TIME,
  horario_3 TIME,
  fecha_inicio DATE,
  fecha_fin DATE,
  indicacion TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);
CREATE TABLE historial_medicinas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  medicina_id INTEGER NOT NULL,
  accion TEXT,
  fecha_cambio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(medicina_id) REFERENCES medicinas(id) ON DELETE CASCADE
);
CREATE TABLE recordatorios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  medicina_id INTEGER NOT NULL,
  usuario_id INTEGER NOT NULL,
  horario_recordatorio TIME NOT NULL,
  completado BOOLEAN DEFAULT 0,
  FOREIGN KEY(medicina_id) REFERENCES medicinas(id) ON DELETE CASCADE,
  FOREIGN KEY(usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);
CREATE TABLE historiales_clinicos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario_id INTEGER NOT NULL UNIQUE,
  resumen_general TEXT,
  alergias TEXT,
  enfermedades_cronicas TEXT,
  operaciones_previas TEXT,
  observaciones TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);
CREATE TABLE contactos_emergencia (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario_id INTEGER NOT NULL,
  nombre TEXT NOT NULL,
  relacion TEXT,
  telefono TEXT NOT NULL,
  email TEXT,
  disponibilidad TEXT,
  notas TEXT,
  es_principal BOOLEAN DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);
CREATE TABLE condiciones_medicas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario_id INTEGER NOT NULL,
  tipo TEXT,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  fecha_diagnostico DATE,
  estado TEXT,
  tratamiento TEXT,
  medico_responsable TEXT,
  observaciones TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);
CREATE TABLE vacunas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario_id INTEGER NOT NULL,
  nombre TEXT NOT NULL,
  fecha_aplicacion DATE,
  fecha_proxima DATE,
  dosis TEXT,
  numero_dosis INTEGER DEFAULT 1,
  total_dosis INTEGER,
  laboratorio TEXT,
  lugar_aplicacion TEXT,
  medico TEXT,
  estado TEXT DEFAULT 'aplicada',
  notas TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);
CREATE TABLE prepagas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario_id INTEGER NOT NULL,
  nombre TEXT NOT NULL,
  plan TEXT,
  numero_afiliado TEXT,
  telefono TEXT,
  telefono_emergencias TEXT,
  email TEXT,
  web TEXT,
  app_link TEXT,
  vencimiento_carnet DATE,
  observaciones TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);
''')

data = [
  ('INSERT INTO usuarios (nombre, email, tipo_usuario, obra_social) VALUES (?,?,?,?)', ('Juan Perez','juan@example.com','titular','OSDE 210')),
  ('INSERT INTO usuarios (nombre, tipo_usuario, usuario_padre_id) VALUES (?,?,?)', ('Mateo Perez','familiar',1)),
  ('INSERT INTO turnos (usuario_id, especialidad, medico, fecha_turno, hora_turno, lugar) VALUES (?,?,?,?,?,?)', (1,'Cardiologia','Dr. Garcia','2026-06-10','10:30','Clinica Central')),
  ('INSERT INTO medicinas (usuario_id, nombre_droga, dosis, frecuencia, horario_1, fecha_inicio, indicacion) VALUES (?,?,?,?,?,?,?)', (1,'Atorvastatina','20 mg','cada 24h','20:00','2026-01-01','Colesterol')),
  ('INSERT INTO historiales_clinicos (usuario_id, resumen_general, alergias) VALUES (?,?,?)', (1,'Paciente con hipertension controlada','Penicilina')),
  ('INSERT INTO contactos_emergencia (usuario_id, nombre, relacion, telefono, es_principal) VALUES (?,?,?,?,?)', (1,'Mariana Perez','Esposa','+549112345678',1)),
  ('INSERT INTO condiciones_medicas (usuario_id, tipo, nombre, estado) VALUES (?,?,?,?)', (1,'enfermedad','Hipertension','controlada')),
  ('INSERT INTO vacunas (usuario_id, nombre, fecha_aplicacion, estado) VALUES (?,?,?,?)', (1,'COVID-19 Pfizer','2023-03-15','completa')),
  ('INSERT INTO vacunas (usuario_id, nombre, fecha_proxima, estado) VALUES (?,?,?,?)', (1,'Gripe','2026-04-01','pendiente')),
  ('INSERT INTO prepagas (usuario_id, nombre, plan, numero_afiliado, telefono, telefono_emergencias, web) VALUES (?,?,?,?,?,?,?)', (1,'OSDE','Plan 210','12345678','0810-555-6733','107','https://www.osde.com.ar')),
]

for sql, params in data:
    cursor.execute(sql, params)

cursor.execute('''
CREATE TABLE IF NOT EXISTS archivos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    nombre_original TEXT NOT NULL,
    nombre_archivo TEXT NOT NULL,
    tipo TEXT,
    tamanio INTEGER,
    descripcion TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
''')

conn.commit()
conn.close()
print('BD creada OK')
