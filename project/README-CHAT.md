# Chat Box con WebSockets

## 🏢 Sistema de Chat por Departamentos

El sistema de chat está integrado con la gestión de departamentos del inventario, permitiendo comunicación específica por área de trabajo.

## 🚀 Funcionalidades

### ✅ Características Implementadas
- **Chat por departamentos** integrado con el sistema de inventario
- **Roles de usuario** (Admin, Supervisor, Usuario)
- **Salas automáticas** basadas en departamentos
- **Lista de usuarios conectados** en tiempo real
- **Indicadores de escritura** (typing indicators)
- **Historial de mensajes** (últimos 100 mensajes por sala)
- **Reconexión automática** en caso de pérdida de conexión
- **Interfaz temática** que se adapta al color del departamento
- **Notificaciones de entrada/salida** de usuarios
- **Selector de departamento** en tiempo real

### 🏢 Departamentos Disponibles
- **Pendiente en Fab** - Fabricación y producción
- **Por llegar** - Logística de entrada
- **En stock** - Inventario disponible
- **Procesos / Oportunidades** - Administrativo
- **Para entrega** - Logística de salida

### 🎯 Componentes Principales

1. **ChatServer** (`server/websocket-server.js`)
   - Servidor WebSocket en Node.js
   - Manejo de salas y usuarios
   - Persistencia de historial en memoria
   - Reconexión automática

2. **useWebSocketChat** (`src/hooks/useWebSocketChat.ts`)
   - Hook personalizado para manejar la conexión WebSocket
   - Estado del chat (mensajes, usuarios, conexión)
   - Funciones para enviar mensajes y unirse a salas

3. **ChatBox** (`src/components/ChatBox.tsx`)
   - Interfaz principal del chat
   - Formulario de unión a sala
   - Lista de mensajes con scroll automático
   - Input de mensajes con indicadores de escritura

4. **ChatToggle** (`src/components/ChatToggle.tsx`)
   - Botón flotante para abrir/cerrar el chat
   - Integración simple en cualquier página

## 🛠️ Instalación y Uso

### 1. Instalar dependencias
```bash
npm install
```

### 2. Iniciar el servidor completo (Frontend + Chat Server)
```bash
npm run dev:full
```

### 3. O iniciar por separado:

**Frontend:**
```bash
npm run dev
```

**Servidor de Chat:**
```bash
npm run chat:server
```

## 📋 Configuración

### Cambiar puerto del servidor WebSocket
Edita `server/websocket-server.js`:
```javascript
const chatServer = new ChatServer(8080); // Cambiar puerto aquí
```

### Configurar URL del WebSocket en el cliente
Edita `src/hooks/useWebSocketChat.ts`:
```typescript
export const useWebSocketChat = (serverUrl: string = 'ws://localhost:8080')
```

### Personalizar salas de chat
En `src/components/UnifiedInventoryPage.tsx`:
```tsx
<ChatToggle 
  username="Admin" 
  department={selectedDepartment}
  userRole="admin"
/>
```

### Agregar nuevos departamentos
El chat se actualiza automáticamente cuando agregas nuevos departamentos en el sistema de gestión de estados.

## 🎨 Personalización

### Colores automáticos por departamento
El chat toma automáticamente los colores del departamento seleccionado:
- **Header del chat** usa el gradiente del departamento
- **Botones** se adaptan al tema
- **Indicadores** mantienen consistencia visual

### Roles de usuario
Los roles se determinan automáticamente:
- **Admin** - Usuarios con "admin" en el nombre
- **Supervisor** - Usuarios con "supervisor" o "jefe" en el nombre  
- **Usuario** - Resto de usuarios

### Agregar más funcionalidades
El sistema está preparado para extender:
- **Emojis y reacciones**
- **Archivos adjuntos**
- **Mensajes privados**
- **Moderación de chat**
- **Persistencia en base de datos**

## 🔧 Estructura de Mensajes WebSocket

### Cliente → Servidor
```json
{
  "type": "join",
  "username": "Usuario",
  "room": "dept-stock",
  "department": "En stock"
}

{
  "type": "chat",
  "message": "Hola mundo!"
}

{
  "type": "typing",
  "isTyping": true
}
```

### Servidor → Cliente
```json
{
  "type": "chat",
  "id": "uuid",
  "username": "Usuario",
  "message": "Hola mundo!",
  "timestamp": "2024-01-01T12:00:00.000Z"
  "department": "En stock",
  "role": "user"
}

{
  "type": "user_list",
  "users": [
    {
      "id": "client-id",
      "username": "Usuario",
      "joinedAt": "2024-01-01T12:00:00.000Z",
      "department": "En stock",
      "role": "admin"
    }
  ]
}
```

## 🔐 Seguridad por Departamentos

- **Aislamiento de mensajes** - Solo usuarios del mismo departamento ven los mensajes
- **Roles visuales** - Iconos y colores diferentes para cada rol
- **Historial separado** - Cada departamento mantiene su propio historial

## 🚀 Producción

Para producción, considera:

1. **Usar un servidor WebSocket dedicado** (Socket.io, ws con clustering)
2. **Persistencia en base de datos** (Redis, MongoDB)
3. **Autenticación y autorización**
4. **Rate limiting** para prevenir spam
5. **Moderación de contenido**
6. **Escalabilidad horizontal** con múltiples instancias

## 🐛 Troubleshooting

### El chat no se conecta
- Verifica que el servidor WebSocket esté corriendo en puerto 8080
- Revisa la consola del navegador para errores
- Asegúrate de que no haya firewall bloqueando el puerto

### Mensajes no se envían
- Verifica el estado de conexión en la interfaz
- Revisa los logs del servidor WebSocket
- Comprueba que el usuario se haya unido correctamente a la sala

### Reconexión no funciona
- El sistema intenta reconectar automáticamente hasta 5 veces
- Si falla, recarga la página para reiniciar la conexión