# Health App - Frontend

React 18 + Vite

## Setup

```bash
cd frontend

# 1. Instalar dependencias
npm install

# 2. Iniciar servidor dev (puerto 3000)
npm run dev
```

El servidor dev automáticamente proxea `/api` a `http://localhost:3001` (backend).

---

## Estructura

```
src/
├── App.jsx                 # App principal con tabs
├── main.jsx               # Entry point
├── index.css              # Estilos globales
├── useApi.js              # Hook para API
└── components/
    ├── Dashboard.jsx      # Vista principal
    ├── Turnos.jsx         # Turnos (crear/listar/editar)
    └── Medicinas.jsx      # Medicinas (agregar/listar/actualizar)
```

---

## Flujo

1. **Dashboard** → resumen de próximos turnos + medicinas activas
2. **Turnos** → crear turno con alarmas automáticas (7d, 24h, 1h)
3. **Medicinas** → agregar medicina con horarios, actualizar dosis, suspender

Próximos pasos:
- Autenticación / login
- Cargar familiares
- Historial clínico
- Notificaciones en tiempo real
