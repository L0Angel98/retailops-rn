# 📦 Offline Orders App (Expo + React Native)

Aplicación móvil offline-first para gestión de órdenes, pensada para entornos operativos (almacén, logística, retail). Permite crear, escanear, actualizar y sincronizar órdenes incluso sin conexión a internet.

## ✨ Características

- 📱 Expo + React Native
- 📴 Offline-first con SQLite
- 🔄 Cola de sincronización + auto-sync al recuperar conexión
- 📦 Órdenes: listar, detalle, cambiar estatus, eliminar
- 📷 Escaneo de códigos de barras con confirmación
- 🔊 Sonido de confirmación (beep)
- 🧠 Optimistic UI (feedback inmediato al cambiar estatus)
- 🧭 Navegación con Tabs + Stack (Expo Router)
- 🔐 Safe Area (notch / status bar)

## 🗄️ Persistencia local

- SQLite (`expo-sqlite`)
- Drizzle ORM
- Tablas principales:
  - `orders`
  - `order_items`
  - `sync_queue`

## 🔄 Sincronización Offline

- Cola local de acciones (`sync_queue`)
- Procesamiento automático al volver online
- Detección real de conectividad
- Evita ejecuciones duplicadas
- Estados claros:
  - `Sincronizado`
  - `Pendiente de sincronizar`

## 🧭 Navegación

- Tabs para secciones principales:
  - Órdenes
  - Nueva
  - Escanear
- Stack interno para detalle de orden
- Gestos nativos:
  - Swipe back en iOS
  - Back del sistema en Android

## 📷 Escaneo de códigos

- Implementado con `expo-camera`
- Bloqueo para evitar múltiples lecturas
- Modal de confirmación
- Sonido de confirmación con `expo-audio`
- Pausa automática al salir de la pantalla

## 🎨 UX / UI

- Chips de estatus con color semántico
- Indicadores de:
  - Online / Offline
  - Sincronizando
- Selección múltiple y eliminación en lote
- Safe Area soportada (notch / status bar)
- Feedback visual al actualizar estatus

## 🧪 Estados de una orden

- `PENDING`
- `PICKING`
- `DELIVERED`

Cada cambio:
- se guarda localmente
- se refleja de inmediato en UI
- se sincroniza cuando hay conexión

## 🚀 Tecnologías

- Expo
- React Native
- Expo Router
- SQLite
- Drizzle ORM
- TanStack React Query
- expo-camera
- expo-audio
- react-native-safe-area-context

## ▶️ Cómo ejecutar el proyecto

### 1️⃣ Instalar dependencias
```bash
npm install
```

### 2️⃣ Ejecutar en desarrollo
```bash
npx expo start
```

### 3️⃣ Limpiar caché (si es necesario)
```bash
npx expo start -c
```

## 🧪 Tips para probar

- Cambia estatus en el detalle y revisa que en la lista aparezca `Pendiente de sincronizar` hasta sincronizar
- Desactiva internet y prueba:
  - crear órdenes
  - cambiar estatus
  - eliminar órdenes
- Activa internet y verifica auto-sync

## 👤 Autor

**Luis Ángel**  
Frontend / Mobile Engineer  
React • Next.js • React Native • TypeScript
