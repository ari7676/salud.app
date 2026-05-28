# 🚀 Health App MVP - Setup Rápido

## Una sola ejecución para todo

### Requisitos previos
- Node.js 16+ (npm)
- Python 3
- SQLite3

---

## PASO 1: Setup inicial (5 minutos)

```bash
# En la carpeta raíz del proyecto
npm run setup
```

Esto:
- ✓ Instala dependencias del backend
- ✓ Instala dependencias del frontend
- ✓ Crea la BD `health_app.db` con datos de ejemplo

---

## PASO 2: Ejecutar todo junto (2 ventanas)

### Opción A: En DOS terminales separadas (recomendado)

**Terminal 1 - Backend:**
```bash
npm run dev:backend
```
Corre en http://localhost:3001

**Terminal 2 - Frontend:**
```bash
npm run dev:frontend
```
Corre en http://localhost:3000

Luego abre **http://localhost:3000** en el navegador.

---

### Opción B: En UNA terminal (experimental)

```bash
npm run dev
```

⚠️ Requiere `concurrently` instalado. Si falla, usa Opción A.

---

## ✅ Verificación

Cuando todo funciona, ves:

**Backend (http://localhost:3001)**
```bash
curl http://localhost:3001/api/usuarios/1
# Respuesta: {"id":1,"nombre":"Juan Pérez",...}
```

**Frontend (http://localhost:3000)**
- Tab "Dashboard": Muestra usuario Juan Pérez + próximos turnos + medicinas
- Tab "Turnos": Forma para crear nuevo turno
- Tab "Medicinas": Forma para agregar nueva medicina

---

## 📁 Estructura del proyecto

```
health-app/
├── package.json           # Scripts principales
├── server.js              # Backend Express
├── init_db.py             # Script para crear BD
├── health_app_schema.sql  # Schema SQL
├── health_app.db          # BD (creada tras npm run setup)
├── README.md              # Docs backend
├── vite.config.js         # Config Vite
├── frontend/
│   ├── package.json       # Scripts frontend
│   ├── index.html         # HTML entry
│   ├── vite.config.js     # Config Vite
│   └── src/
│       ├── main.jsx       # Entry point React
│       ├── App.jsx        # App principal
│       ├── index.css      # Estilos globales
│       ├── useApi.js      # Hook para API
│       └── components/
│           ├── Dashboard.jsx    # Resumen
│           ├── Turnos.jsx       # Turnos
│           └── Medicinas.jsx    # Medicinas
└── README.md              # Este archivo

```

---

## 🧪 Datos de ejemplo

Al crear la BD se cargan automáticamente:

**Usuario principal (ID=1):**
- Nombre: Juan Pérez
- Email: juan@example.com
- Obra social: OSDE 210

**Usuario familiar (ID=2):**
- Nombre: Mateo Pérez (hijo)
- Familiar de: Juan Pérez

**Turnos ejemplo:**
- Cardiología - 2026-06-10 10:30 (con alarmas)
- Pediatría - 2026-06-15 14:00

**Medicinas ejemplo:**
- Atorvastatina 20mg (colesterol)
- Losartán 50mg (presión)
- Amoxicilina 250mg (hasta 2026-05-27)

---

## 🔧 Troubleshooting

### "Port 3000 already in use"
```bash
# Frontend corre en otro puerto
cd frontend && npm run dev -- --port 3001
```

### "Port 3001 already in use"
```bash
# Backend en otro puerto
PORT=3002 npm run dev:backend
# Luego actualizar proxy en vite.config.js
```

### "health_app.db no existe"
```bash
npm run init-db
```

### Errores de CORS
- Verifica que backend esté en puerto 3001
- Verifica que vite.config.js tenga proxy correcto

---

## 📝 Próximos pasos

1. **Login / Autenticación** → agregar JWT
2. **Cargar familiares** → seleccionar usuario en dropdown
3. **Historias clínicas** → tabla HISTORIALES
4. **Notificaciones** → implementar alarmas reales
5. **Deploy** → Vercel (frontend) + Railway/Heroku (backend)

---

## 📞 Scripts útiles

```bash
# Ver BD
sqlite3 health_app.db ".tables"
sqlite3 health_app.db "SELECT * FROM usuarios;"

# Rebuild frontend
cd frontend && npm run build

# Clean install
rm -rf node_modules frontend/node_modules health_app.db
npm run setup
```

---

**¡Listo!** Abre http://localhost:3000 y prueba la app.
