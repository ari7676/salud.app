# Health App MVP - Setup Completo

Aplicación de gestión de salud personal. Backend (Node.js) + Frontend (React).

---

## ⚡ Setup en 1 comando

```bash
npm run setup
```

Esto instala todo (backend + frontend) y crea la BD con datos de ejemplo.

---

## 🚀 Ejecutar todo de una vez

```bash
npm run dev
```

Abre **dos servidores en paralelo**:
- **Backend**: http://localhost:3001
- **Frontend**: http://localhost:3000

Si todo funciona, en ~5 segundos verás:
```
[0] ✓ Server running on http://localhost:3001
[1] VITE v4.x.x ready in xxx ms
```

---

## 📋 Requisitos

- Node.js 16+ (npm)
- Python 3 (para inicializar BD)

---

## 🗂️ Estructura

```
.
├── server.js                  # Backend Express
├── init_db.py                 # Script para crear BD
├── health_app_schema.sql      # Schema SQLite
├── health_app.db              # BD (se crea con setup)
├── package.json               # Root scripts
├── frontend/                  # App React
│   ├── src/
│   │   ├── App.jsx
│   │   ├── components/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Turnos.jsx
│   │   │   └── Medicinas.jsx
│   │   └── useApi.js
│   ├── package.json
│   └── vite.config.js
└── README.md
```

---

## 💻 Uso

Una vez corriendo:

### 1. Dashboard (vista principal)
- Resumen de usuario
- Próximos 3 turnos
- Primeras 5 medicinas activas

### 2. Turnos
- **Crear turno**: especialidad, fecha/hora, lugar, obra social
- **Alarmas automáticas**: 7 días, 24h, 1h antes
- **Editar**: marcar como asistido, cambiar fecha

### 3. Medicinas
- **Agregar**: droga, dosis, frecuencia, horarios
- **Actualizar**: cambiar dosis, agregar/quitar horarios
- **Suspender**: marcar como finalizada

---

## 🔧 Scripts disponibles

```bash
npm run setup              # Instala deps + crea BD
npm run dev               # Ejecuta backend + frontend en paralelo
npm run dev:backend       # Solo backend (puerto 3001)
npm run dev:frontend      # Solo frontend (puerto 3000)
npm run init-db           # Reinicializa BD (borra datos)
npm run install-all       # npm install en ambos lados
npm run build             # Build frontend para producción
```

---

## 📊 Base de datos

Tablas creadas automáticamente:
- **usuarios** - titulares + familiares
- **turnos** - citas médicas con alarmas
- **medicinas** - fármacos, dosis, horarios
- **recordatorios** - recordatorios de medicinas
- **historial_medicinas** - log de cambios

Datos de ejemplo incluídos (usuario "Juan Pérez").

---

## 🌐 API Backend

```
GET    /api/usuarios              # Listar usuarios
POST   /api/usuarios              # Crear usuario
GET    /api/usuarios/:id          # Obtener usuario + familia

GET    /api/turnos                # Listar turnos
POST   /api/turnos                # Crear turno
GET    /api/turnos/:id            # Obtener turno
PUT    /api/turnos/:id            # Actualizar turno

GET    /api/medicinas             # Listar medicinas
POST   /api/medicinas             # Crear medicina
GET    /api/medicinas/:id         # Obtener medicina
PUT    /api/medicinas/:id         # Actualizar medicina
```

---

## 🎯 Próximos pasos

- [ ] Autenticación (login/signup)
- [ ] Cargar familiares desde dashboard
- [ ] Historial clínico (estudios, diagnósticos)
- [ ] Notificaciones en tiempo real
- [ ] Cargar alimentos + cálculo de pasos
- [ ] Exportar reportes PDF
- [ ] Mobile responsive (ya funciona)

---

## 🚀 Deploy

Para producción:

```bash
npm run build              # Genera frontend/dist
# Luego deployar frontend/dist a un hosting estático
# Y server.js a un hosting Node.js (Railway, Render, Heroku, etc)
```

---

## 💡 Notas

- Frontend proxea `/api` a backend automáticamente (vite.config.js)
- Usuario hardcodeado a ID 1 (después agregar login)
- BD SQLite local (cambiar a PostgreSQL para producción)

---

¡Listo! Con `npm run setup && npm run dev` todo arranca. 🎉
