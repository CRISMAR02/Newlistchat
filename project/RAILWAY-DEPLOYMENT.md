# 🚀 Desplegar Chat en Railway

## Pasos para desplegar en Railway:

### 1. Preparar el código
✅ Ya está listo con los archivos configurados

### 2. Subir a GitHub
```bash
git add .
git commit -m "Configurar para Railway deployment"
git push origin main
```

### 3. Crear proyecto en Railway
1. Ve a [railway.app](https://railway.app)
2. Haz clic en "Start a New Project"
3. Selecciona "Deploy from GitHub repo"
4. Conecta tu repositorio

### 4. Configurar variables de entorno
En el dashboard de Railway, ve a Variables y agrega:
```
NODE_ENV=production
```

### 5. Configurar dominio personalizado (opcional)
1. En Railway, ve a Settings > Domains
2. Genera un dominio público
3. Copia la URL (ej: `tu-proyecto.railway.app`)

### 6. Actualizar frontend
Actualiza tu archivo `.env.production`:
```
VITE_WEBSOCKET_URL=wss://tu-proyecto.railway.app
```

### 7. Redesplegar frontend
Si usas Vercel/Netlify para el frontend:
1. Agrega la variable de entorno `VITE_WEBSOCKET_URL`
2. Redesplega

## 🔧 Verificar que funciona:

### Desarrollo local:
```bash
npm run dev:full
```
- Frontend: http://localhost:5173
- WebSocket: ws://localhost:8080

### Producción:
- Frontend: tu-dominio-frontend.vercel.app
- WebSocket: wss://tu-proyecto.railway.app

## 🐛 Troubleshooting:

### Si el chat no conecta:
1. Verifica que Railway esté ejecutando el servidor
2. Revisa los logs en Railway dashboard
3. Confirma que la URL del WebSocket sea correcta
4. Verifica que no haya firewall bloqueando

### Logs útiles:
```bash
# En Railway, ve a la pestaña "Deployments" > "View Logs"
```

## 💡 Ventajas de Railway:
- ✅ Soporta WebSockets nativamente
- ✅ Escalabilidad automática
- ✅ SSL/TLS automático (wss://)
- ✅ Integración con GitHub
- ✅ Plan gratuito generoso
- ✅ Fácil configuración

## 🎯 Resultado final:
Tu chat funcionará en tiempo real entre todos los departamentos, con:
- Conexiones seguras (WSS)
- Reconexión automática
- Historial de mensajes
- Indicadores de escritura
- Lista de usuarios conectados